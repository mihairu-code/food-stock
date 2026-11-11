import { Plus } from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import { useHouseholdId } from '@/app/session'
import { EmptyState } from '@/components/EmptyState'
import { StockIcon } from '@/components/StockIcon'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import type { NewShoppingItem } from '@/data/backend'
import { useHomeData, useShoppingList, useSortedSections } from '@/data/useHomeData'
import { useHomeMutation } from '@/data/useHomeMutation'
import type { Product, Section, ShoppingItem } from '@/domain/types'
import { AddItemSheet } from '@/sheets/AddItemSheet'
import { PurchaseSheet } from '@/sheets/PurchaseSheet'
import { ShoppingRow } from './ShoppingRow'
import { useShoppingActions, type ShoppingActions } from './useShoppingActions'

type ShoppingSheet = { type: 'add-item' } | { type: 'purchase'; item: ShoppingItem }

/** Продукт дома в покупках; точка на иконке — есть ли он ещё дома. memo — чтобы правка одной строки не перерисовывала список. */
const ProductEntry = memo(function ProductEntry({
  product,
  section,
  actions,
}: {
  product: Product
  section: Section | null
  actions: ShoppingActions
}) {
  const stock = product.is_available ? 'Есть дома' : 'Закончилось'
  return (
    <ShoppingRow
      name={product.name}
      icon={<StockIcon icon={product.icon} />}
      meta={section ? `${section.name} · ${stock}` : stock}
      missing={!product.is_available}
      removeLabel={`Убрать «${product.name}» из покупок`}
      onBuy={() => actions.buyProduct(product)}
      onRemove={() => actions.dropProduct(product)}
    />
  )
})

/** Позиция, добавленная вручную: при покупке спрашиваем, в какой раздел её положить. */
const ManualEntry = memo(function ManualEntry({
  item,
  actions,
  onBuy,
}: {
  item: ShoppingItem
  actions: ShoppingActions
  onBuy: (item: ShoppingItem) => void
}) {
  return (
    <ShoppingRow
      name={item.name}
      icon={
        <span className="emoji" aria-hidden="true">
          {item.icon || '🛒'}
        </span>
      }
      meta="Добавлено вручную"
      removeLabel={`Убрать «${item.name}» из покупок`}
      onBuy={() => onBuy(item)}
      onRemove={() => actions.removeItem(item)}
    />
  )
})

export function ShoppingScreen() {
  const hid = useHouseholdId()
  const toast = useToast()
  const { isLoading, isError } = useHomeData()
  const entries = useShoppingList()
  const sections = useSortedSections()
  const actions = useShoppingActions()
  const [sheet, setSheet] = useState<ShoppingSheet | null>(null)
  const close = () => setSheet(null)
  const openPurchase = useCallback((item: ShoppingItem) => setSheet({ type: 'purchase', item }), [])

  const createItem = useHomeMutation(
    (input: NewShoppingItem) => backend.createShoppingItem(hid, input),
    (cache, input) =>
      cache.shoppingItems((list) => [
        ...list,
        { ...input, household_id: hid, created_at: new Date().toISOString(), created_by: null },
      ]),
  )

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
        <EmptyState emoji="🛒" title="Список пуст" text="Закончившиеся постоянные продукты появятся здесь сами, остальное — по плюсу на продукте." />
      ) : (
        <div className="card list">
          {entries.map((entry) =>
            entry.type === 'product' ? (
              <ProductEntry key={entry.key} product={entry.product} section={entry.section} actions={actions} />
            ) : (
              <ManualEntry key={entry.key} item={entry.item} actions={actions} onBuy={openPurchase} />
            ),
          )}
        </div>
      )}

      {sheet?.type === 'add-item' && (
        <AddItemSheet
          onSave={(input) => {
            createItem.mutate(input)
            toast(`«${input.name}» в покупках`)
          }}
          onClose={close}
        />
      )}
      {sheet?.type === 'purchase' && (
        <PurchaseSheet
          item={sheet.item}
          sections={sections}
          onPurchase={(sectionId, makeStaple) => actions.purchaseItem(sheet.item, sectionId, makeStaple)}
          onClose={close}
        />
      )}
    </>
  )
}
