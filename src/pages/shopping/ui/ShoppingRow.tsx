import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import type { StockState } from '@/entities/product'
import { useT } from '@/shared/i18n'
import { ListRow } from '@/shared/ui'

interface ShoppingRowProps {
  /** Идентификатор строки в списке покупок: продукта или ручной позиции. */
  id: string
  name: string
  meta: string
  /** Иконка слева: у продукта дома — с точкой наличия. */
  icon: ReactNode
  /** Наличие продукта дома; у ручной позиции не задаётся, и точки нет. */
  stock?: StockState
  /** Копия строки под пальцем во время перетаскивания — выглядит точно как настоящая. */
  ghost?: boolean
  onBuy: () => void
  onEdit: () => void
  onRemove: () => void
}

/**
 * Общий вид строки покупок: та же строка, что на экране «Дом», только справа галочка
 * «Куплено» вместо плюса, а удаление убирает из списка.
 */
export function ShoppingRow({ id, name, meta, icon, stock, ghost = false, onBuy, onEdit, onRemove }: ShoppingRowProps) {
  const t = useT()
  return (
    <ListRow
      id={id}
      kind="entry"
      dragDescription={t('dnd.product')}
      icon={icon}
      name={name}
      meta={meta}
      stock={stock}
      ghost={ghost}
      toggle={{ label: t('shopping.boughtAria', { name }), icon: <Check size={18} />, onClick: onBuy }}
      editLabel={t('product.edit', { name })}
      onEdit={onEdit}
      removeLabel={t('product.removeFromList', { name })}
      removeSwipeLabel={t('shopping.remove')}
      onRemove={onRemove}
    />
  )
}
