import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { useT } from '@/i18n'
import { isDragActive } from '@/lib/dragState'

interface SwipeRowProps {
  /** Вызывается после свайпа влево дальше порога — когда строка уже уехала и схлопнулась. */
  onDelete: () => void
  /** Подпись под строкой во время жеста; по умолчанию «Удалить». */
  label?: string
  /** Жест отключён: строка ещё сохраняется. Во время перетаскивания он выключается сам. */
  disabled?: boolean
  children: ReactNode
}

/** Сдвиг, после которого жест считается свайпом, а не прокруткой или нажатием. */
const LOCK_DISTANCE = 10
/** Доля ширины строки, после которой отпускание удаляет её. */
const DELETE_RATIO = 0.28
/** Быстрый смах удаляет и с меньшего расстояния: скорость (пикселей в миллисекунду) и минимум пути. */
const FLING_SPEED = 0.45
const FLING_DISTANCE = 36
/** Палец, который столько пролежал на месте, не свайпает: строку удерживают, чтобы перетащить. */
const HOLD_MS = 200
/** Строка уезжает влево, затем её место схлопывается. Те же длительности — в стилях .swipe. */
const SLIDE_MS = 170
const COLLAPSE_MS = 170
/** Если после удаления строка всё ещё на экране (запрос не удалил её), возвращаем её вид. */
const RESTORE_MS = 900

interface Gesture {
  x: number
  y: number
  at: number
  locked: boolean
  offset: number
  /** Последняя точка и скорость в ней — чтобы распознать быстрый смах. */
  lastX: number
  lastAt: number
  speed: number
}

/**
 * Строка, которую удаляют свайпом влево. Жест — не единственный способ:
 * вызывающий код обязан дать и кнопку удаления для клавиатуры и скринридера.
 *
 * Пока палец ведёт строку, она двигается напрямую, минуя перерисовку React, —
 * так она не отстаёт от пальца. Удаление плавное: строка уезжает, её место
 * схлопывается, и только потом она исчезает из списка.
 */
export function SwipeRow({ onDelete, label, disabled = false, children }: SwipeRowProps) {
  const t = useT()
  const root = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  // Красная подложка видна, только пока строка сдвинута.
  const [revealed, setRevealed] = useState(false)
  const gesture = useRef<Gesture | null>(null)
  const suppressClick = useRef(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const later = (run: () => void, ms: number) => timers.current.push(window.setTimeout(run, ms))

  function slide(offset: number, animated: boolean) {
    const element = content.current
    if (!element) return
    element.style.transition = animated ? '' : 'none'
    element.style.transform = offset ? `translateX(${offset}px)` : ''
  }

  function settle() {
    slide(0, true)
    later(() => setRevealed(false), SLIDE_MS)
  }

  /** Возвращает строке обычный вид — если она пережила удаление. */
  function restore() {
    const element = root.current
    if (!element) return
    element.style.transition = ''
    element.style.height = ''
    element.style.opacity = ''
    slide(0, false)
    setRevealed(false)
  }

  function remove(width: number) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDelete()
      later(restore, RESTORE_MS)
      return
    }
    slide(-width, true)
    later(() => {
      const element = root.current
      if (!element) return
      // Высота фиксируется числом, иначе переходу не от чего считать.
      element.style.height = `${element.offsetHeight}px`
      void element.offsetHeight
      element.style.transition = `height ${COLLAPSE_MS}ms ease, opacity ${COLLAPSE_MS}ms ease`
      element.style.height = '0px'
      element.style.opacity = '0'
      later(() => {
        onDelete()
        later(restore, RESTORE_MS)
      }, COLLAPSE_MS)
    }, SLIDE_MS)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      at: event.timeStamp,
      locked: false,
      offset: 0,
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
      if (start.locked) settle()
      return
    }
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.locked) {
      if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return
      const held = event.pointerType !== 'mouse' && event.timeStamp - start.at > HOLD_MS
      if (Math.abs(dy) >= Math.abs(dx) || dx > 0 || held) {
        gesture.current = null // прокрутка, свайп вправо или удержание — не наш жест
        return
      }
      start.locked = true
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
    start.offset = Math.min(0, dx)
    slide(start.offset, false)
  }

  function finish(cancelled: boolean) {
    const start = gesture.current
    gesture.current = null
    if (!start?.locked) return
    const width = root.current?.offsetWidth ?? 0
    const distance = -start.offset
    const far = distance > width * DELETE_RATIO
    const flung = start.speed < -FLING_SPEED && distance > FLING_DISTANCE
    if (!cancelled && width > 0 && (far || flung)) remove(width)
    else settle()
  }

  return (
    <div className="swipe" ref={root} data-active={revealed}>
      <div className="swipe-under" aria-hidden="true">
        <Trash2 size={18} />
        {label ?? t('common.delete')}
      </div>
      <div
        className="swipe-content"
        ref={content}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => finish(false)}
        onPointerCancel={() => finish(true)}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            suppressClick.current = false
            event.preventDefault()
            event.stopPropagation()
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
