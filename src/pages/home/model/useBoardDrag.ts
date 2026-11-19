import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { useMemo } from 'react'
import { useReorderProducts } from '@/entities/product'
import { useReorderSections } from '@/entities/section'
import type { Product, Section } from '@/shared/api'
import { useDragDraft } from '@/shared/lib/drag/useDragDraft'
import { notify } from '@/shared/lib/toast'
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
 * между собой. Черновик и его жизнь — в useDragDraft; здесь — правила доски.
 */
export function useBoardDrag(sections: Section[], products: Product[]) {
  const saved = useMemo(() => buildBoard(sections, products), [sections, products])
  const drag = useDragDraft<Board, ActiveDrag>(saved)
  const { mutate: reorderProducts } = useReorderProducts()
  const { mutate: reorderSections } = useReorderSections()

  function onDragStart({ active: item }: DragStartEvent) {
    drag.startDrag({ kind: item.data.current?.kind as DragKind, id: String(item.id) })
  }

  // Продукт оказался над другим разделом — он сразу переезжает туда, и раздел раздвигается.
  function onDragOver(event: DragOverEvent) {
    drag.noteDragOver(event)
    const { active: item, over } = event
    if (!over || item.data.current?.kind !== 'product') return
    const productId = String(item.id)
    const overId = String(over.id)
    drag.setDraft((current) => {
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
    drag.finishDrag()
    const board = drag.draft ?? saved
    const id = String(item.id)
    const overId = over ? String(over.id) : null

    if (item.data.current?.kind === 'section') {
      const next = overId ? moveSection(board, id, overId) : board
      if (sameSections(next, saved)) return drag.discardDraft()
      drag.keepDraftUntilSaved(next)
      return reorderSections(next.sections)
    }

    const next = overId && over?.data.current?.kind === 'product' ? moveWithinSection(board, id, overId) : board
    const sectionId = sectionOf(next, id)
    if (!sectionId || sameProducts(next, saved, sectionId)) return drag.discardDraft()
    drag.keepDraftUntilSaved(next)
    reorderProducts({ sectionId, productIds: next.products[sectionId] })

    if (sectionId !== sectionOf(saved, id)) {
      notify('toast.movedTo', {
        name: products.find((product) => product.id === id)?.name ?? '',
        section: sections.find((section) => section.id === sectionId)?.name ?? '',
      })
    }
  }

  return {
    board: drag.draft ?? saved,
    active: drag.active,
    sensors: drag.sensors,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel: drag.cancelDrag },
  }
}
