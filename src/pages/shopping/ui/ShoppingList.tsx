import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { shoppingEntryName, type ShoppingEntry } from '@/entities/shopping-list'
import { useT } from '@/shared/i18n'
import { dragAccessibility } from '@/shared/lib/drag/dragAccessibility'
import { DROP_ANIMATION } from '@/shared/lib/drag/dragMotion'
import { useShoppingActions } from '../model/useShoppingActions'
import { useShoppingDrag } from '../model/useShoppingDrag'
import { ManualRow } from './ManualRow'
import { ShoppingProductRow } from './ShoppingProductRow'

/** Список покупок: продукты дома и ручные позиции одним списком, который можно переставлять. */
export function ShoppingList({ entries: saved }: { entries: ShoppingEntry[] }) {
  const t = useT()
  const actions = useShoppingActions()
  const { entries, active, sensors, handlers } = useShoppingDrag(saved)
  const ids = useMemo(() => entries.map((entry) => entry.id), [entries])
  const accessibility = useMemo(
    () =>
      dragAccessibility(t, (id) => {
        const entry = saved.find((candidate) => candidate.id === id)
        return entry ? shoppingEntryName(entry) : ''
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
                manualTwins={entry.manualTwins}
                actions={actions}
              />
            ) : (
              <ManualRow key={entry.key} item={entry.item} homeProduct={entry.homeProduct} actions={actions} />
            ),
          )}
        </SortableContext>
      </div>

      {createPortal(
        <DragOverlay dropAnimation={DROP_ANIMATION}>
          {active && (
            // Класс list — чтобы копия была той же высоты, что строки списка.
            <div className="drag-ghost list" inert>
              {active.type === 'product' ? (
                <ShoppingProductRow
                  product={active.product}
                  sectionName={active.section?.name ?? ''}
                  manualTwins={active.manualTwins}
                  actions={actions}
                  ghost
                />
              ) : (
                <ManualRow item={active.item} actions={actions} ghost />
              )}
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
