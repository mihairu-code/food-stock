import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { useReorderProducts, useReorderSections } from '@/data/hooks'
import type { Product, Section } from '@/domain/types'
import { useDragSensors } from '@/hooks/useDragSensors'
import { haptic } from '@/lib/haptics'
import { notify } from '@/lib/toast'
import {
  buildBoard,
  moveSection,
  moveToSection,
  moveWithinSection,
  sameProducts,
  sameSections,
  sectionOf,
  type Board,
  type DragKind,
} from './board'

export interface ActiveDrag {
  kind: DragKind
  id: string
}

/**
 * Перетаскивание на главном экране: продукты внутри раздела и между разделами, разделы
 * между собой. Пока идёт жест, расположение живёт в черновике; после отпускания оно
 * сохраняется одним запросом.
 */
export function useBoardDrag(sections: Section[], products: Product[]) {
  const saved = useMemo(() => buildBoard(sections, products), [sections, products])
  const [draft, setDraft] = useState<Board | null>(null)
  const [active, setActive] = useState<ActiveDrag | null>(null)
  const { mutate: reorderProducts } = useReorderProducts()
  const { mutate: reorderSections } = useReorderSections()
  const sensors = useDragSensors()

  function stop() {
    setActive(null)
    setDraft(null)
  }

  function onDragStart({ active: item }: DragStartEvent) {
    setDraft(saved)
    setActive({ kind: item.data.current?.kind as DragKind, id: String(item.id) })
    haptic('pick')
  }

  // Продукт оказался над другим разделом — он сразу переезжает туда, и раздел раздвигается.
  function onDragOver({ active: item, over }: DragOverEvent) {
    if (over && over.id !== item.id) haptic('move')
    if (!over || item.data.current?.kind !== 'product') return
    const productId = String(item.id)
    const overId = String(over.id)
    setDraft((current) => {
      if (!current) return current
      const overSection = over.data.current?.kind === 'section'
      const target = overSection ? overId : sectionOf(current, overId)
      if (!target || target === sectionOf(current, productId)) return current
      const list = current.products[target] ?? []
      // Середина перетаскиваемой строки ниже середины той, над которой она оказалась, — встаём после неё.
      const dragged = item.rect.current.translated
      const below = dragged ? dragged.top + dragged.height / 2 > over.rect.top + over.rect.height / 2 : false
      const index = overSection ? list.length : list.indexOf(overId) + (below ? 1 : 0)
      return moveToSection(current, productId, target, index)
    })
  }

  function onDragEnd({ active: item, over }: DragEndEvent) {
    const board = draft ?? saved
    stop()
    haptic('drop')
    const id = String(item.id)
    const overId = over ? String(over.id) : null

    if (item.data.current?.kind === 'section') {
      const next = overId ? moveSection(board, id, overId) : board
      if (sameSections(next, saved)) return
      return reorderSections(next.sections)
    }

    const next = overId && over?.data.current?.kind === 'product' ? moveWithinSection(board, id, overId) : board
    const sectionId = sectionOf(next, id)
    if (!sectionId || sameProducts(next, saved, sectionId)) return
    reorderProducts({ sectionId, productIds: next.products[sectionId] })

    if (sectionId !== sectionOf(saved, id)) {
      notify('toast.movedTo', {
        name: products.find((product) => product.id === id)?.name ?? '',
        section: sections.find((section) => section.id === sectionId)?.name ?? '',
      })
    }
  }

  function onDragCancel() {
    stop()
  }

  return { board: draft ?? saved, active, sensors, handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel } }
}
