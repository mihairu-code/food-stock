import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useHouseholdId } from '@/app/session'
import { EmptyState } from '@/components/EmptyState'
import { backend } from '@/data'
import type { NewShoppingItem } from '@/data/backend'
import { useHomeData, useShoppingList, useSortedSections } from '@/data/useHomeData'
import { useHomeMutation } from '@/data/useHomeMutation'
import type { ShoppingItem } from '@/domain/types'
import { AddItemSheet } from '@/sheets/AddItemSheet'
import { PurchaseSheet } from '@/sheets/PurchaseSheet'
import { ShoppingRow } from './ShoppingRow'

type ShoppingSheet = { type: 'add-item' } | { type: 'purchase'; item: ShoppingItem }

export function ShoppingScreen() {
  const hid = useHouseholdId()
  const { isLoading, isError } = useHomeData()
  const entries = useShoppingList()
  const sections = useSortedSections()
  const [sheet, setSheet] = useState<ShoppingSheet | null>(null)
  const close = () => setSheet(null)

  const createItem = useHomeMutation((input: NewShoppingItem) => backend.createShoppingItem(hid, input))
  const deleteItem = useHomeMutation((id: string) => backend.deleteShoppingItem(id))
  const purchase = useHomeMutation((v: { itemId: string; sectionId: string; makeStaple: boolean }) =>
    backend.purchaseShoppingItem(v.itemId, v.sectionId, v.makeStaple),
  )
  // Постоянный продукт куплен — он снова есть дома и сам уходит из списка.
  const buyProduct = useHomeMutation((id: string) => backend.setAvailability(id, true))
  const deleteProduct = useHomeMutation((id: string) => backend.deleteProduct(id))

  if (isLoading) return <p className="status">Загрузка…</p>
  if (isError) return <p className="status">Не удалось загрузить данные</p>

  return (
    <>
      <div className="summary">
        <p>{entries.length === 0 ? 'Всё куплено' : <>Купить: <strong>{entries.length}</strong></>}</p>
        <button className="btn small" type="button" onClick={() => setSheet({ type: 'add-item' })}>
          <Plus size={16} aria-hidden="true" /> Добавить
        </button>
      </div>

      {entries.length === 0 ? (
        <EmptyState emoji="🛒" title="Список пуст" text="Закончившиеся постоянные продукты появятся здесь сами." />
      ) : (
        <div className="card list">
          {entries.map((entry) =>
            entry.type === 'product' ? (
              <ShoppingRow
                key={entry.key}
                name={entry.product.name}
                icon={entry.product.icon}
                meta={`${entry.section?.name ?? ''} · Закончилось`}
                missing
                // Строка — это сам продукт дома: удаляется он целиком, и из раздела тоже.
                removeLabel={`Удалить «${entry.product.name}»`}
                onBuy={() => buyProduct.mutate(entry.product.id)}
                onRemove={() => deleteProduct.mutate(entry.product.id)}
              />
            ) : (
              <ShoppingRow
                key={entry.key}
                name={entry.item.name}
                icon={entry.item.icon}
                meta="Добавлено вручную"
                removeLabel={`Убрать «${entry.item.name}» из покупок`}
                onBuy={() => setSheet({ type: 'purchase', item: entry.item })}
                onRemove={() => deleteItem.mutate(entry.item.id)}
              />
            ),
          )}
        </div>
      )}

      {sheet?.type === 'add-item' && <AddItemSheet onSave={(input) => createItem.mutate(input)} onClose={close} />}
      {sheet?.type === 'purchase' && (
        <PurchaseSheet
          item={sheet.item}
          sections={sections}
          onPurchase={(sectionId, makeStaple) => purchase.mutate({ itemId: sheet.item.id, sectionId, makeStaple })}
          onClose={close}
        />
      )}
    </>
  )
}
