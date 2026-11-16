import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { useReorderProducts } from '@/entities/product/api/productApi'
import { useReorderSections } from '@/entities/section/api/sectionApi'
import type { Product, Section } from '@/shared/api/types'
import { setDragActive } from '@/shared/lib/drag/dragState'
import { useDragSensors } from '@/shared/lib/drag/useDragSensors'
import { haptic } from '@/shared/lib/haptics'
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
 * между собой. Пока идёт жест, расположение живёт в черновике; после отпускания оно
 * сохраняется одним запросом, а черновик остаётся на экране до тех пор, пока сюда
 * не придут обновлённые данные, — строка не возвращается на старое место ни на кадр.
 */
export function useBoardDrag(sections: Section[], products: Product[]) {
  const saved = useMemo(() => buildBoard(sections, products), [sections, products])
  const [draft, setDraft] = useState<Board | null>(null)
  const [active, setActive] = useState<ActiveDrag | null>(null)
  // Данные, которые были на экране в момент отпускания. Пока они не сменились, показываем черновик.
  const [dropped, setDropped] = useState<Board | null>(null)
  const { mutate: reorderProducts } = useReorderProducts()
  const { mutate: reorderSections } = useReorderSections()
  const sensors = useDragSensors()

  // Данные обновились (оптимистично или с сервера) — дальше показываем их, а не черновик.
  // Сбрасывать черновик раньше нельзя: до этого момента в `saved` ещё старый порядок.
  if (draft && !active && dropped && saved !== dropped) {
    setDraft(null)
    setDropped(null)
  }

  function stop() {
    setDragActive(false)
    setActive(null)
  }

  /** Жест закончился без изменений. */
  function reset() {
    setDraft(null)
    setDropped(null)
  }

  /** Черновик остаётся на экране, пока не придут данные с новым порядком. */
  function pin(next: Board) {
    setDraft(next)
    setDropped(saved)
  }

  function onDragStart({ active: item }: DragStartEvent) {
    setDragActive(true)
    setDropped(null)
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
    stop()
    haptic('drop')
    const board = draft ?? saved
    const id = String(item.id)
    const overId = over ? String(over.id) : null

    if (item.data.current?.kind === 'section') {
      const next = overId ? moveSection(board, id, overId) : board
      if (sameSections(next, saved)) return reset()
      pin(next)
      return reorderSections(next.sections)
    }

    const next = overId && over?.data.current?.kind === 'product' ? moveWithinSection(board, id, overId) : board
    const sectionId = sectionOf(next, id)
    if (!sectionId || sameProducts(next, saved, sectionId)) return reset()
    pin(next)
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
    reset()
  }

  return { board: draft ?? saved, active, sensors, handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel } }
}
