import { memo } from 'react'
import { StockIcon } from '@/entities/product/ui/StockIcon'
import type { Product } from '@/shared/api/types'
import { useT } from '@/shared/i18n'
import { ShoppingRow } from './ShoppingRow'
import type { ShoppingActions } from './useShoppingActions'

interface ShoppingProductRowProps {
  product: Product
  sectionName: string
  actions: ShoppingActions
  ghost?: boolean
}

/** Продукт дома, положенный в покупки. Точка на иконке — есть ли он ещё дома. */
export const ShoppingProductRow = memo(function ShoppingProductRow({
  product,
  sectionName,
  actions,
  ghost,
}: ShoppingProductRowProps) {
  const t = useT()
  const stock = t(product.is_available ? 'shopping.stillHome' : 'shopping.out')
  return (
    <ShoppingRow
      id={product.id}
      name={product.name}
      meta={sectionName ? `${sectionName} · ${stock}` : stock}
      missing={!product.is_available}
      ghost={ghost}
      icon={<StockIcon icon={product.icon} />}
      onBuy={() => actions.buyProduct(product)}
      onRemove={() => actions.dropProduct(product)}
    />
  )
})
