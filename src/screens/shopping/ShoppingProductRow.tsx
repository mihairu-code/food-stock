import { memo } from 'react'
import { StockIcon } from '@/components'
import type { Product } from '@/domain/types'
import { useT } from '@/i18n'
import { ShoppingRow } from './ShoppingRow'
import type { ShoppingActions } from './useShoppingActions'

interface ShoppingProductRowProps {
  product: Product
  sectionName: string
  actions: ShoppingActions
}

/** Продукт дома, положенный в покупки. Точка на иконке — есть ли он ещё дома. */
export const ShoppingProductRow = memo(function ShoppingProductRow({
  product,
  sectionName,
  actions,
}: ShoppingProductRowProps) {
  const t = useT()
  const stock = t(product.is_available ? 'shopping.stillHome' : 'shopping.out')
  return (
    <ShoppingRow
      name={product.name}
      meta={sectionName ? `${sectionName} · ${stock}` : stock}
      missing={!product.is_available}
      icon={<StockIcon icon={product.icon} />}
      onBuy={() => actions.buyProduct(product)}
      onRemove={() => actions.dropProduct(product)}
    />
  )
})
