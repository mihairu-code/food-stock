import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { useReorderShopping, type ShoppingEntry } from '@/entities/shopping-list'
import { setDragActive } from '@/shared/lib/drag/dragState'
import { useDragSensors } from '@/shared/lib/drag/useDragSensors'
import { haptic } from '@/shared/lib/haptics'

/**
 * Перетаскивание строк в списке покупок. Пока идёт жест, порядок живёт в черновике;
 * после отпускания он сохраняется одним запросом, а черновик остаётся на экране, пока
 * сюда не придут обновлённые данные, — строка не возвращается на старое место ни на кадр.
 */
export function useShoppingDrag(entries: ShoppingEntry[]) {
  const saved = useMemo(() => entries.map((entry) => entry.id), [entries])
  const [draft, setDraft] = useState<string[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  // Порядок, который был на экране в момент отпускания. Пока он не сменился, показываем черновик.
  const [dropped, setDropped] = useState<string[] | null>(null)
  const { mutate: reorder } = useReorderShopping()
  const sensors = useDragSensors()

  // Данные обновились (оптимистично или с сервера) — дальше показываем их, а не черновик.
  if (draft && !activeId && dropped && saved !== dropped) {
    setDraft(null)
    setDropped(null)
  }

  const ordered = useMemo(() => {
    if (!draft) return entries
    const byId = new Map(entries.map((entry) => [entry.id, entry]))
    const placed = new Set(draft)
    // Строки, появившиеся уже после начала жеста, встают в конец.
    return [...draft.flatMap((id) => byId.get(id) ?? []), ...entries.filter((entry) => !placed.has(entry.id))]
  }, [draft, entries])

  function stop() {
    setDragActive(false)
    setActiveId(null)
  }

  /** Жест закончился без изменений. */
  function reset() {
    setDraft(null)
    setDropped(null)
  }

  function onDragStart({ active }: DragStartEvent) {
    setDragActive(true)
    setDropped(null)
    setDraft(saved)
    setActiveId(String(active.id))
    haptic('pick')
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (over && over.id !== active.id) haptic('move')
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    stop()
    haptic('drop')
    const ids = ordered.map((entry) => entry.id)
    const from = ids.indexOf(String(active.id))
    const to = over ? ids.indexOf(String(over.id)) : -1
    if (from < 0 || to < 0 || from === to) return reset()
    const next = arrayMove(ids, from, to)
    setDraft(next)
    setDropped(saved)
    reorder(next)
  }

  function onDragCancel() {
    stop()
    reset()
  }

  return {
    entries: ordered,
    active: activeId ? entries.find((entry) => entry.id === activeId) : undefined,
    sensors,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
  }
}
