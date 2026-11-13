import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'
import { SORT_TRANSITION } from '@/lib/dragMotion'

interface SortableRowProps {
  id: string
  /** Что это за строка — по нему список понимает, над чем её несут. */
  kind: string
  /** Название для скринридера. */
  label: string
  /** Пояснение роли: «продукт, можно переставить». */
  description: string
  /** Строку нельзя взять (например, она ещё сохраняется). */
  disabled?: boolean
  /** На строку можно бросить другую; false — когда она не видна. */
  droppable?: boolean
  /**
   * Содержимое. Передаётся готовым, а не функцией: пока идёт перетаскивание, строка
   * обновляется часто, и неизменное содержимое при этом не перерисовывается.
   */
  children: ReactNode
}

/** Строка списка, которую можно перетащить на другое место: удержанием, мышью или с клавиатуры. */
export function SortableRow({ id, kind, label, description, disabled = false, droppable = true, children }: SortableRowProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    data: { kind },
    transition: SORT_TRANSITION,
    disabled: { draggable: disabled, droppable: !droppable },
    attributes: { role: 'group', roleDescription: description },
  })

  return (
    <div
      ref={setNodeRef}
      className="sortable-row"
      data-dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={label}
    >
      {children}
    </div>
  )
}
