import { memo } from 'react'
import type { ShoppingItem } from '@/domain/types'
import { useT } from '@/i18n'
import { openSheet } from '@/sheets'
import { ShoppingRow } from './ShoppingRow'
import type { ShoppingActions } from './useShoppingActions'

interface ManualRowProps {
  item: ShoppingItem
  actions: ShoppingActions
}

/** Позиция, добавленная вручную: при покупке спрашиваем, в какой раздел её положить. */
export const ManualRow = memo(function ManualRow({ item, actions }: ManualRowProps) {
  const t = useT()
  return (
    <ShoppingRow
      name={item.name}
      meta={t('shopping.manual')}
      icon={<span className="emoji" aria-hidden="true">{item.icon || '🛒'}</span>}
      onBuy={() => openSheet({ type: 'purchase', item })}
      onRemove={() => actions.removeItem(item)}
    />
  )
})
