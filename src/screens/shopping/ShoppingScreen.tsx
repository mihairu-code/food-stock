import { Plus } from 'lucide-react'
import { memo } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { StockIcon } from '@/components/StockIcon'
import { useHomeData, useShoppingList } from '@/data/hooks'
import type { Product, Section, ShoppingItem } from '@/domain/types'
import { useT } from '@/i18n'
import { rich } from '@/i18n/rich'
import { openSheet } from '@/sheets'
import { ShoppingRow } from './ShoppingRow'
import { useShoppingActions, type ShoppingActions } from './useShoppingActions'

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
  const t = useT()
  const stock = t(product.is_available ? 'shopping.stillHome' : 'shopping.out')
  return (
    <ShoppingRow
      name={product.name}
      icon={<StockIcon icon={product.icon} />}
      meta={section ? `${section.name} · ${stock}` : stock}
      missing={!product.is_available}
      removeLabel={t('product.removeFromList', { name: product.name })}
      onBuy={() => actions.buyProduct(product)}
      onRemove={() => actions.dropProduct(product)}
    />
  )
})

/** Позиция, добавленная вручную: при покупке спрашиваем, в какой раздел её положить. */
const ManualEntry = memo(function ManualEntry({ item, actions }: { item: ShoppingItem; actions: ShoppingActions }) {
  const t = useT()
  return (
    <ShoppingRow
      name={item.name}
      icon={
        <span className="emoji" aria-hidden="true">
          {item.icon || '🛒'}
        </span>
      }
      meta={t('shopping.manual')}
      removeLabel={t('product.removeFromList', { name: item.name })}
      onBuy={() => openSheet({ type: 'purchase', item })}
      onRemove={() => actions.removeItem(item)}
    />
  )
})

export function ShoppingScreen() {
  const t = useT()
  const { isLoading, isError } = useHomeData()
  const entries = useShoppingList()
  const actions = useShoppingActions()

  if (isLoading) return <p className="status">{t('shopping.loading')}</p>
  if (isError) return <p className="status">{t('common.loadError')}</p>

  return (
    <>
      <div className="summary">
        <p>{entries.length === 0 ? t('shopping.nothing') : rich(t('shopping.summary', { count: entries.length }))}</p>
        <button className="btn small" type="button" onClick={() => openSheet({ type: 'add-item' })}>
          <Plus size={16} aria-hidden="true" /> {t('common.add')}
        </button>
      </div>

      {entries.length === 0 ? (
        <EmptyState emoji="🛒" title={t('shopping.emptyTitle')} text={t('shopping.emptyText')} />
      ) : (
        <div className="card list">
          {entries.map((entry) =>
            entry.type === 'product' ? (
              <ProductEntry key={entry.key} product={entry.product} section={entry.section} actions={actions} />
            ) : (
              <ManualEntry key={entry.key} item={entry.item} actions={actions} />
            ),
          )}
        </div>
      )}

    </>
  )
}
