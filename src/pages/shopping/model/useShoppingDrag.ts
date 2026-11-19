import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useMemo } from 'react'
import { useReorderShopping, type ShoppingEntry } from '@/entities/shopping-list'
import { useDragDraft } from '@/shared/lib/drag/useDragDraft'

/**
 * Перетаскивание строк в списке покупок. Черновик порядка и его жизнь — в useDragDraft;
 * здесь — как из черновика собрать список и как сохранить новый порядок.
 */
export function useShoppingDrag(entries: ShoppingEntry[]) {
  const saved = useMemo(() => entries.map((entry) => entry.id), [entries])
  const drag = useDragDraft<string[], string>(saved)
  const { mutate: reorder } = useReorderShopping()
  const { draft } = drag

  const ordered = useMemo(() => {
    if (!draft) return entries
    const byId = new Map(entries.map((entry) => [entry.id, entry]))
    const placed = new Set(draft)
    // Строки, появившиеся уже после начала жеста, встают в конец.
    return [...draft.flatMap((id) => byId.get(id) ?? []), ...entries.filter((entry) => !placed.has(entry.id))]
  }, [draft, entries])

  function onDragStart({ active }: DragStartEvent) {
    drag.startDrag(String(active.id))
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    drag.finishDrag()
    const ids = ordered.map((entry) => entry.id)
    const from = ids.indexOf(String(active.id))
    const to = over ? ids.indexOf(String(over.id)) : -1
    if (from < 0 || to < 0 || from === to) return drag.discardDraft()
    const next = arrayMove(ids, from, to)
    drag.keepDraftUntilSaved(next)
    reorder(next)
  }

  return {
    entries: ordered,
    active: drag.active ? entries.find((entry) => entry.id === drag.active) : undefined,
    sensors: drag.sensors,
    handlers: { onDragStart, onDragOver: drag.noteDragOver, onDragEnd, onDragCancel: drag.cancelDrag },
  }
}
