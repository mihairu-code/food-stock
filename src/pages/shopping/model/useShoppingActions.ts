import { useMemo } from 'react'
import { useSetProductState } from '@/entities/product/api/productApi'
import { useDeleteShoppingItem } from '@/entities/shopping-item/api/shoppingItemApi'
import { PURCHASED, withToBuy } from '@/shared/api/homeDataRules'
import type { Product, ShoppingItem } from '@/shared/api/types'
import { notify } from '@/shared/lib/toast'

export interface ShoppingActions {
  /** Продукт дома куплен: он снова есть и уходит из списка. */
  buyProduct: (product: Product) => void
  /** Убрать из покупок, не покупая: сам продукт и его наличие остаются как были. */
  dropProduct: (product: Product) => void
  removeItem: (item: ShoppingItem) => void
}

/** Действия над строками списка покупок; объект стабилен — для memo-строк. */
export function useShoppingActions(): ShoppingActions {
  const { mutate: setState } = useSetProductState()
  const { mutate: deleteItem } = useDeleteShoppingItem()

  return useMemo(
    () => ({
      buyProduct(product) {
        setState({ id: product.id, state: PURCHASED })
        notify('toast.backHome', { name: product.name })
      },
      dropProduct(product) {
        setState({ id: product.id, state: withToBuy(product, false) })
        notify('toast.removedFromList', { name: product.name })
      },
      removeItem(item) {
        deleteItem(item.id)
      },
    }),
    [setState, deleteItem],
  )
}
