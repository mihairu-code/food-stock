import type { ShoppingEntry } from '@/domain/logic'
import { ManualRow } from './ManualRow'
import { ShoppingProductRow } from './ShoppingProductRow'
import { useShoppingActions } from './useShoppingActions'

/** Список покупок: продукты дома и ручные позиции одним списком. */
export function ShoppingList({ entries }: { entries: ShoppingEntry[] }) {
  const actions = useShoppingActions()
  return (
    <div className="card list">
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
    </div>
  )
}
