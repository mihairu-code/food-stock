import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { ShoppingEntry } from '@/domain/logic'
import { useT } from '@/i18n'
import { dragAnnouncements } from '@/lib/dragAnnouncements'
import { ManualRow } from './ManualRow'
import { ShoppingProductRow } from './ShoppingProductRow'
import { useShoppingActions } from './useShoppingActions'
import { useShoppingDrag } from './useShoppingDrag'

const nameOf = (entry: ShoppingEntry) => (entry.type === 'product' ? entry.product.name : entry.item.name)

/** Список покупок: продукты дома и ручные позиции одним списком, который можно переставлять. */
export function ShoppingList({ entries: saved }: { entries: ShoppingEntry[] }) {
  const t = useT()
  const actions = useShoppingActions()
  const { entries, active, sensors, handlers } = useShoppingDrag(saved)
  const ids = useMemo(() => entries.map((entry) => entry.id), [entries])
  const accessibility = useMemo(
    () => ({
      screenReaderInstructions: { draggable: t('dnd.instructions') },
      announcements: dragAnnouncements((id) => {
        const entry = saved.find((candidate) => candidate.id === id)
        return entry ? nameOf(entry) : ''
      }),
    }),
    [t, saved],
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} accessibility={accessibility} {...handlers}>
      <div className="card list">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {entries.map((entry) =>
            entry.type === 'product' ? (
              <ShoppingProductRow
                key={entry.key}
                product={entry.product}
                sectionName={entry.section?.name ?? ''}
                actions={actions}
              />
            ) : (
              <ManualRow key={entry.key} item={entry.item} actions={actions} />
            ),
          )}
        </SortableContext>
      </div>

      {createPortal(
        <DragOverlay>
          {active?.type === 'product' && (
            <ShoppingProductRow
              product={active.product}
              sectionName={active.section?.name ?? ''}
              actions={actions}
              ghost
            />
          )}
          {active?.type === 'manual' && <ManualRow item={active.item} actions={actions} ghost />}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
