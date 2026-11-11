import { Trash2 } from 'lucide-react'
import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { useT } from '@/i18n'

interface SwipeRowProps {
  /** Вызывается, если строку утянули влево дальше порога. */
  onDelete: () => void
  /** Подпись под строкой во время жеста; по умолчанию «Удалить». */
  label?: string
  children: ReactNode
}

/** Сдвиг, после которого жест считается свайпом, а не прокруткой или нажатием. */
const LOCK_DISTANCE = 10
/** Доля ширины строки, после которой отпускание удаляет её. */
const DELETE_RATIO = 0.35

interface Gesture {
  x: number
  y: number
  locked: boolean
  offset: number
}

/**
 * Строка, которую удаляют свайпом влево. Жест — не единственный способ:
 * в самой строке обязана быть кнопка удаления для клавиатуры и скринридера.
 */
export function SwipeRow({ onDelete, label, children }: SwipeRowProps) {
  const t = useT()
  const root = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<Gesture | null>(null)
  const suppressClick = useRef(false)

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    gesture.current = { x: event.clientX, y: event.clientY, locked: false, offset: 0 }
    suppressClick.current = false
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.locked) {
      if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return
      if (Math.abs(dy) >= Math.abs(dx) || dx > 0) {
        gesture.current = null // прокрутка или свайп вправо — не наш жест
        return
      }
      start.locked = true
      suppressClick.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    start.offset = Math.min(0, dx)
    setOffset(start.offset)
  }

  function finish() {
    const start = gesture.current
    gesture.current = null
    setDragging(false)
    if (!start?.locked) return
    const width = root.current?.offsetWidth ?? 0
    if (width > 0 && -start.offset > width * DELETE_RATIO) {
      setOffset(-width)
      onDelete()
    } else {
      setOffset(0)
    }
  }

  return (
    <div className="swipe" ref={root} data-active={offset !== 0}>
      <div className="swipe-under" aria-hidden="true">
        <Trash2 size={18} />
        {label ?? t('common.delete')}
      </div>
      <div
        className="swipe-content"
        data-dragging={dragging}
        style={offset ? { transform: `translateX(${offset}px)` } : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
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
