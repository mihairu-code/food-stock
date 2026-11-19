import { memo } from 'react'
import type { Product, ShoppingItem } from '@/shared/api'
import { useT } from '@/shared/i18n'
import type { ShoppingActions } from '../model/useShoppingActions'
import { ShoppingRow } from './ShoppingRow'

interface ManualRowProps {
  item: ShoppingItem
  /** Продукт дома с тем же названием: покупка отмечает его. */
  homeProduct?: Product
  actions: ShoppingActions
  ghost?: boolean
}

/** Позиция, добавленная вручную: при покупке спрашиваем, в какой раздел её положить. */
export const ManualRow = memo(function ManualRow({ item, homeProduct, actions, ghost }: ManualRowProps) {
  const t = useT()
  return (
    <ShoppingRow
      id={item.id}
      name={item.name}
      meta={t('shopping.manual')}
      ghost={ghost}
      icon={<span className="emoji" aria-hidden="true">{item.icon || '🛒'}</span>}
      onBuy={() => actions.buyItem(item, homeProduct)}
      onEdit={() => actions.editItem(item)}
      onRemove={() => actions.deleteItem(item)}
    />
  )
})
