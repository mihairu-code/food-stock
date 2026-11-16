import { memo } from 'react'
import type { ShoppingItem } from '@/shared/api/types'
import { useT } from '@/shared/i18n'
import { openSheet } from '@/shared/ui/sheet/sheetStore'
import { ShoppingRow } from './ShoppingRow'
import type { ShoppingActions } from './useShoppingActions'

interface ManualRowProps {
  item: ShoppingItem
  actions: ShoppingActions
  ghost?: boolean
}

/** Позиция, добавленная вручную: при покупке спрашиваем, в какой раздел её положить. */
export const ManualRow = memo(function ManualRow({ item, actions, ghost }: ManualRowProps) {
  const t = useT()
  return (
    <ShoppingRow
      id={item.id}
      name={item.name}
      meta={t('shopping.manual')}
      ghost={ghost}
      icon={<span className="emoji" aria-hidden="true">{item.icon || '🛒'}</span>}
      onBuy={() => openSheet({ type: 'purchase', item })}
      onRemove={() => actions.removeItem(item)}
    />
  )
})
