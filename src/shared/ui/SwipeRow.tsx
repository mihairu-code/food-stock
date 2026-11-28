import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { isDragActive } from '@/shared/lib/drag/dragState'
import { haptic } from '@/shared/lib/haptics'
import { openSwipeRow } from './openSwipeRow'

export interface SwipeAction {
  /** Название действия: кнопка показывает только иконку, название читает скринридер. */
  label: string
  icon: ReactNode
  /**
   * danger — удаление: красная кнопка, которая растягивается, когда строку тянут дальше
   * кнопок; длинный свайп вызывает её сам. Перед вызовом строка уезжает и схлопывается.
   */
  tone: 'accent' | 'danger'
  onSelect: () => void
}

interface SwipeRowProps {
  /** Кнопки, которые открываются под строкой при свайпе влево, слева направо. */
  actions: SwipeAction[]
  /** Жест отключён: строка ещё сохраняется. Во время перетаскивания он выключается сам. */
  disabled?: boolean
  /** Метка для окна подсказки (data-coach): окно про свайп подёргивает эту строку. */
  coach?: string
  children: ReactNode
}

/** Сдвиг, после которого жест считается свайпом, а не прокруткой или нажатием. */
const LOCK_DISTANCE = 10
/** Палец, который столько пролежал на месте, не свайпает: строку удерживают, чтобы перетащить. */
const HOLD_MS = 200
/** Отпустили дальше этой доли ширины кнопок — они остаются открытыми. */
const OPEN_RATIO = 0.4
/**
 * Длинный свайп: строку утянули дальше этой доли её ширины — отпущенная, она удаляется.
 * Порог не ближе FULL_SWIPE_MARGIN за открытыми кнопками, чтобы на узком экране
 * удаление не срабатывало там, где человек хотел только открыть кнопки.
 */
const FULL_SWIPE_RATIO = 0.55
const FULL_SWIPE_MARGIN = 48
/** Вернуться от порога удаления можно, отведя палец на столько назад: без дрожания на границе. */
const DISARM_GAP = 24
/** Без кнопки удаления тянуть дальше кнопок можно, но сверх их ширины — не больше чем на столько. */
const RUBBER_LIMIT = 96
/** Быстрый смах (пикселей в миллисекунду) и минимум его пути. */
const FLING_SPEED = 0.45
const FLING_DISTANCE = 36
/** Строка уезжает влево, затем её место схлопывается. Те же длительности — в стилях .swipe. */
const SLIDE_MS = 170
const COLLAPSE_MS = 170
/**
 * Возвращаясь на место, строка чуть проскакивает вправо и встаёт обратно. Отскок
 * пропорционален пути: закрытие открытых кнопок даёт несколько пикселей, короткий
 * неудавшийся свайп — почти ничего.
 */
const BOUNCE_MS = 380
const BOUNCE_EASING = 'cubic-bezier(0.3, 1.45, 0.5, 1)'
/** Если после удаления строка всё ещё на экране (запрос не удался), возвращаем ей вид. */
const RESTORE_MS = 900

type Motion = 'follow' | 'snap' | 'bounce'

interface Gesture {
  x: number
  y: number
  at: number
  locked: boolean
  /** Сдвиг строки в начале жеста: 0 или ширина открытых кнопок. */
  startOffset: number
  offset: number
  /** Ширина строки — до неё можно утянуть строку при длинном свайпе. */
  rowWidth: number
  /** Строка дальше порога удаления: отпущенная, она удалится. */
  armed: boolean
  lastX: number
  lastAt: number
  speed: number
}

/** Сопротивление сверх ширины кнопок: чем дальше тянут, тем меньше строка поддаётся. */
const resist = (over: number) => over / (1 + over / RUBBER_LIMIT)

/**
 * Строка, у которой свайпом влево открываются кнопки действий (изменить, удалить).
 * Кнопки встают на место, куда сдвинулась строка. Если тянуть дальше, растягивается
 * кнопка удаления, а за порогом она занимает всю полосу: отпущенная строка удаляется.
 * Жест — не единственный способ: вызывающий код даёт те же действия кнопками для мыши,
 * клавиатуры и скринридера.
 *
 * Пока палец ведёт строку, она двигается напрямую, минуя перерисовку React, —
 * так она не отстаёт от пальца.
 */
export function SwipeRow({ actions, disabled = false, coach, children }: SwipeRowProps) {
  const root = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const tray = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)
  const gesture = useRef<Gesture | null>(null)
  const openOffset = useRef(0)
  /** Ширина открытых кнопок; меряется в начале жеста, пока кнопка удаления ещё не растянута. */
  const openWidth = useRef(0)
  const suppressClick = useRef(false)
  const timers = useRef<number[]>([])
  // Постоянный маркер этой строки — по нему узнаём, она ли сейчас открыта.
  const [owner] = useState(() => ({}))
  const deleteAction = actions.find((action) => action.tone === 'danger')

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
    // Пустая строка — переход из стилей; отскок у строки и кнопок один, иначе между ними мелькал бы зазор.
    row.style.transition =
      motion === 'follow' ? 'none' : motion === 'bounce' ? `transform ${BOUNCE_MS}ms ${BOUNCE_EASING}` : ''
    buttons.style.transition =
      motion === 'follow' ? 'none' : motion === 'bounce' ? `width ${BOUNCE_MS}ms ${BOUNCE_EASING}` : ''
    row.style.transform = offset ? `translateX(${-offset}px)` : ''
    buttons.style.width = `${offset}px`
  }

  /** За порогом удаления кнопка удаления занимает всю полосу, остальные уходят. */
  function setArmed(armed: boolean) {
    const element = root.current
    if (!element) return
    if (armed) element.dataset.armed = 'true'
    else delete element.dataset.armed
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
    setArmed(false)
    moveRow(0, 'bounce')
    scheduleTimer(() => {
      if (openOffset.current === 0) setRevealed(false)
    }, BOUNCE_MS)
  }

  /** Возвращает строке обычный вид — если она пережила удаление. */
  function restoreAfterFailedDelete() {
    const element = root.current
    if (!element) return
    element.style.transition = ''
    element.style.height = ''
    element.style.opacity = ''
    openOffset.current = 0
    setArmed(false)
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
    setArmed(true)
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
      rowWidth: 0,
      armed: false,
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
      start.rowWidth = root.current?.offsetWidth ?? 0
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
    if (deleteAction) {
      // Строка идёт за пальцем до самого края: дальше кнопок растягивается удаление.
      start.offset = Math.min(pulled, start.rowWidth)
      const fullSwipeAt = Math.max(start.rowWidth * FULL_SWIPE_RATIO, limit + FULL_SWIPE_MARGIN)
      const armed = start.offset > (start.armed ? fullSwipeAt - DISARM_GAP : fullSwipeAt)
      if (armed !== start.armed) {
        start.armed = armed
        setArmed(armed)
        if (armed) haptic('arm')
      }
    } else {
      start.offset = pulled > limit ? limit + resist(pulled - limit) : pulled
    }
    moveRow(start.offset, 'follow')
  }

  function finishGesture(cancelled: boolean) {
    const start = gesture.current
    gesture.current = null
    if (!start?.locked) return
    if (!cancelled && start.armed && deleteAction) return slideAwayAndDelete(deleteAction.onSelect)
    setArmed(false)
    const flungLeft = start.speed < -FLING_SPEED && start.offset - start.startOffset > FLING_DISTANCE
    const flungRight = start.speed > FLING_SPEED
    const open = !cancelled && !flungRight && (flungLeft || start.offset > openWidth.current * OPEN_RATIO)
    if (open) snapOpen()
    else snapClosed()
  }

  return (
    <div className="swipe" ref={root} data-active={revealed} data-coach={coach}>
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
