import { memo } from 'react'
import { ProductStockIcon } from '@/entities/product'
import type { Product, ShoppingItem } from '@/shared/api'
import { useT } from '@/shared/i18n'
import type { ShoppingActions } from '../model/useShoppingActions'
import { ShoppingRow } from './ShoppingRow'

interface ShoppingProductRowProps {
  product: Product
  sectionName: string
  /** Ручные позиции с тем же названием — уходят вместе с покупкой. */
  manualTwins: ShoppingItem[]
  actions: ShoppingActions
  ghost?: boolean
}

/** Продукт дома, положенный в покупки. Точка на иконке — есть ли он ещё дома. */
export const ShoppingProductRow = memo(function ShoppingProductRow({
  product,
  sectionName,
  manualTwins,
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
      icon={<ProductStockIcon icon={product.icon} />}
      onBuy={() => actions.buyProduct(product, manualTwins)}
      onEdit={() => actions.editProduct(product)}
      onRemove={() => actions.dropProduct(product)}
    />
  )
})
