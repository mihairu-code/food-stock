import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { useReorderShopping } from '@/data/hooks'
import type { ShoppingEntry } from '@/domain/logic'
import { useDragSensors } from '@/hooks/useDragSensors'
import { haptic } from '@/lib/haptics'

/**
 * Перетаскивание строк в списке покупок. Пока идёт жест, порядок живёт в черновике;
 * после отпускания он сохраняется одним запросом.
 */
export function useShoppingDrag(entries: ShoppingEntry[]) {
  const saved = useMemo(() => entries.map((entry) => entry.id), [entries])
  const [draft, setDraft] = useState<string[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { mutate: reorder } = useReorderShopping()
  const sensors = useDragSensors()

  const ordered = useMemo(() => {
    if (!draft) return entries
    const byId = new Map(entries.map((entry) => [entry.id, entry]))
    const placed = new Set(draft)
    // Строки, появившиеся уже после начала жеста, встают в конец.
    return [...draft.flatMap((id) => byId.get(id) ?? []), ...entries.filter((entry) => !placed.has(entry.id))]
  }, [draft, entries])

  function stop() {
    setActiveId(null)
    setDraft(null)
  }

  function onDragStart({ active }: DragStartEvent) {
    setDraft(saved)
    setActiveId(String(active.id))
    haptic('pick')
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (over && over.id !== active.id) haptic('move')
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const ids = ordered.map((entry) => entry.id)
    stop()
    haptic('drop')
    const from = ids.indexOf(String(active.id))
    const to = over ? ids.indexOf(String(over.id)) : -1
    if (from < 0 || to < 0 || from === to) return
    reorder(arrayMove(ids, from, to))
  }

  function onDragCancel() {
    stop()
  }

  return {
    entries: ordered,
    active: activeId ? entries.find((entry) => entry.id === activeId) : undefined,
    sensors,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
  }
}
