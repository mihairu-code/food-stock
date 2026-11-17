import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { isDragActive } from '@/shared/lib/drag/dragState'
import { openSwipeRow } from './openSwipeRow'

export interface SwipeAction {
  /** Название действия: кнопка показывает только иконку, название читает скринридер. */
  label: string
  icon: ReactNode
  /** danger — удаление: красная кнопка. Перед вызовом строка уезжает и схлопывается. */
  tone: 'accent' | 'danger'
  onSelect: () => void
}

interface SwipeRowProps {
  /** Кнопки, которые открываются под строкой при свайпе влево, слева направо. */
  actions: SwipeAction[]
  /** Жест отключён: строка ещё сохраняется. Во время перетаскивания он выключается сам. */
  disabled?: boolean
  children: ReactNode
}

/** Сдвиг, после которого жест считается свайпом, а не прокруткой или нажатием. */
const LOCK_DISTANCE = 10
/** Палец, который столько пролежал на месте, не свайпает: строку удерживают, чтобы перетащить. */
const HOLD_MS = 200
/** Отпустили дальше этой доли ширины кнопок — они остаются открытыми. */
const OPEN_RATIO = 0.4
/** Тянуть дальше кнопок можно, но сверх их ширины — не больше чем на столько. */
const RUBBER_LIMIT = 96
/** Быстрый смах (пикселей в миллисекунду) и минимум его пути. */
const FLING_SPEED = 0.45
const FLING_DISTANCE = 36
/** Строка уезжает влево, затем её место схлопывается. Те же длительности — в стилях .swipe. */
const SLIDE_MS = 170
const COLLAPSE_MS = 170
/** Если после удаления строка всё ещё на экране (запрос не удался), возвращаем ей вид. */
const RESTORE_MS = 900

type Motion = 'follow' | 'snap'

interface Gesture {
  x: number
  y: number
  at: number
  locked: boolean
  /** Сдвиг строки в начале жеста: 0 или ширина открытых кнопок. */
  startOffset: number
  offset: number
  lastX: number
  lastAt: number
  speed: number
}

/** Сопротивление сверх ширины кнопок: чем дальше тянут, тем меньше строка поддаётся. */
const resist = (over: number) => over / (1 + over / RUBBER_LIMIT)

/**
 * Строка, у которой свайпом влево открываются кнопки действий (изменить, удалить).
 * Кнопки встают на место, куда сдвинулась строка; дальше строка поддаётся всё туже.
 * Жест — не единственный способ: вызывающий код даёт те же действия кнопками для мыши,
 * клавиатуры и скринридера.
 *
 * Пока палец ведёт строку, она двигается напрямую, минуя перерисовку React, —
 * так она не отстаёт от пальца.
 */
export function SwipeRow({ actions, disabled = false, children }: SwipeRowProps) {
  const root = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const tray = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)
  const gesture = useRef<Gesture | null>(null)
  const openOffset = useRef(0)
  /** Ширина открытых кнопок; меряется в начале жеста. */
  const openWidth = useRef(0)
  const suppressClick = useRef(false)
  const timers = useRef<number[]>([])
  // Постоянный маркер этой строки — по нему узнаём, она ли сейчас открыта.
  const [owner] = useState(() => ({}))

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
      openSwipeRow.release(owner)
    }
  }, [owner])

  // Пока кнопки открыты, касание в любом другом месте их закрывает.
  useEffect(() => {
    if (!revealed) return
    const closeOnOutsidePress = (event: globalThis.PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) openSwipeRow.closeIfOpen(owner)
    }
    document.addEventListener('pointerdown', closeOnOutsidePress, true)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress, true)
  }, [revealed, owner])

  const scheduleTimer = (run: () => void, ms: number) => timers.current.push(window.setTimeout(run, ms))

  /** Сдвигает строку и растягивает под ней кнопки на ту же ширину. */
  function moveRow(offset: number, motion: Motion) {
    const row = content.current
    const buttons = tray.current
    if (!row || !buttons) return
    // Пустая строка — переход из стилей.
    row.style.transition = motion === 'follow' ? 'none' : ''
    buttons.style.transition = motion === 'follow' ? 'none' : ''
    row.style.transform = offset ? `translateX(${-offset}px)` : ''
    buttons.style.width = `${offset}px`
  }

  /** Ширина кнопок в открытом состоянии — по их ширине из стилей, с полями и промежутками. */
  function measureButtons(): number {
    const buttons = tray.current
    if (!buttons) return 0
    const style = getComputedStyle(buttons)
    const count = buttons.children.length
    const spacing =
      parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.columnGap || '0') * (count - 1)
    return [...buttons.children].reduce((sum, button) => sum + parseFloat(getComputedStyle(button).flexBasis), spacing)
  }

  function snapOpen() {
    openSwipeRow.claim(owner, snapClosed)
    openOffset.current = openWidth.current
    moveRow(openOffset.current, 'snap')
    setRevealed(true)
  }

  function snapClosed() {
    openSwipeRow.release(owner)
    openOffset.current = 0
    moveRow(0, 'snap')
    scheduleTimer(() => {
      if (openOffset.current === 0) setRevealed(false)
    }, SLIDE_MS)
  }

  /** Возвращает строке обычный вид — если она пережила удаление. */
  function restoreAfterFailedDelete() {
    const element = root.current
    if (!element) return
    element.style.transition = ''
    element.style.height = ''
    element.style.opacity = ''
    openOffset.current = 0
    moveRow(0, 'follow')
    setRevealed(false)
  }

  /** Строка уезжает влево целиком, её место схлопывается, и только потом она удаляется. */
  function slideAwayAndDelete(onDelete: () => void) {
    openSwipeRow.release(owner)
    const width = root.current?.offsetWidth ?? 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || width === 0) {
      onDelete()
      scheduleTimer(restoreAfterFailedDelete, RESTORE_MS)
      return
    }
    moveRow(width, 'snap')
    scheduleTimer(() => {
      const element = root.current
      if (!element) return
      // Высота фиксируется числом, иначе переходу не от чего считать.
      element.style.height = `${element.offsetHeight}px`
      void element.offsetHeight
      element.style.transition = `height ${COLLAPSE_MS}ms ease, opacity ${COLLAPSE_MS}ms ease`
      element.style.height = '0px'
      element.style.opacity = '0'
      scheduleTimer(() => {
        onDelete()
        scheduleTimer(restoreAfterFailedDelete, RESTORE_MS)
      }, COLLAPSE_MS)
    }, SLIDE_MS)
  }

  function runAction(action: SwipeAction) {
    if (action.tone === 'danger') return slideAwayAndDelete(action.onSelect)
    snapClosed()
    action.onSelect()
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      at: event.timeStamp,
      locked: false,
      startOffset: openOffset.current,
      offset: openOffset.current,
      lastX: event.clientX,
      lastAt: event.timeStamp,
      speed: 0,
    }
    suppressClick.current = false
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current
    if (!start) return
    if (disabled || isDragActive()) {
      // Жест перехватили (строку начали перетаскивать) — возвращаем её на место.
      gesture.current = null
      if (start.locked) snapClosed()
      return
    }
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.locked) {
      if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return
      const held = event.pointerType !== 'mouse' && event.timeStamp - start.at > HOLD_MS
      // Закрытую строку двигают только влево, открытую — в обе стороны.
      const wrongWay = start.startOffset === 0 && dx > 0
      if (Math.abs(dy) >= Math.abs(dx) || wrongWay || held) {
        gesture.current = null // прокрутка, свайп не в ту сторону или удержание — не наш жест
        return
      }
      start.locked = true
      openWidth.current = measureButtons()
      suppressClick.current = true
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // указатель уже отпущен — жест просто закончится без захвата
      }
      setRevealed(true)
    }

    const elapsed = event.timeStamp - start.lastAt
    if (elapsed > 0) {
      // Сглаженная скорость: последние движения весят больше, но одиночный рывок её не решает.
      start.speed = start.speed * 0.4 + ((event.clientX - start.lastX) / elapsed) * 0.6
      start.lastX = event.clientX
      start.lastAt = event.timeStamp
    }
    const pulled = Math.max(0, start.startOffset - dx)
    const limit = openWidth.current
    start.offset = pulled > limit ? limit + resist(pulled - limit) : pulled
    moveRow(start.offset, 'follow')
  }

  function finishGesture(cancelled: boolean) {
    const start = gesture.current
    gesture.current = null
    if (!start?.locked) return
    const flungLeft = start.speed < -FLING_SPEED && start.offset - start.startOffset > FLING_DISTANCE
    const flungRight = start.speed > FLING_SPEED
    const open = !cancelled && !flungRight && (flungLeft || start.offset > openWidth.current * OPEN_RATIO)
    if (open) snapOpen()
    else snapClosed()
  }

  return (
    <div className="swipe" ref={root} data-active={revealed}>
      <div className="swipe-actions" ref={tray} inert={!revealed}>
        {actions.map((action) => (
          <button
            key={action.label}
            className="swipe-action"
            type="button"
            data-tone={action.tone}
            aria-label={action.label}
            onClick={() => runAction(action)}
          >
            {action.icon}
          </button>
        ))}
      </div>
      <div
        className="swipe-content"
        ref={content}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => finishGesture(false)}
        onPointerCancel={() => finishGesture(true)}
        onClickCapture={(event) => {
          // Нажатие на открытую строку только закрывает кнопки, а не срабатывает.
          if (suppressClick.current || openOffset.current > 0) {
            suppressClick.current = false
            event.preventDefault()
            event.stopPropagation()
            if (openOffset.current > 0) snapClosed()
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
