import { useMemo } from 'react'
import { PURCHASED, useSetProductState, withToBuy } from '@/entities/product'
import { useDeleteShoppingItem } from '@/entities/shopping-item'
import type { Product, ShoppingItem } from '@/shared/api'
import { notify } from '@/shared/lib/toast'
import { openSheet } from '@/shared/ui'

export interface ShoppingActions {
  /** Продукт дома куплен: он снова есть и уходит из списка. */
  buyProduct: (product: Product) => void
  /** Ручная позиция куплена: шторка спрашивает, в какой раздел её положить. */
  buyItem: (item: ShoppingItem) => void
  /** Убрать из покупок, не покупая: сам продукт и его наличие остаются как были. */
  dropProduct: (product: Product) => void
  deleteItem: (item: ShoppingItem) => void
}

/** Действия над строками списка покупок; объект стабилен — для memo-строк. */
export function useShoppingActions(): ShoppingActions {
  const { mutate: setState } = useSetProductState()
  const { mutate: deleteItemById } = useDeleteShoppingItem()

  return useMemo<ShoppingActions>(
    () => ({
      buyProduct(product) {
        setState({ id: product.id, state: PURCHASED })
        notify('toast.backHome', { name: product.name })
      },
      buyItem(item) {
        openSheet({ type: 'purchase', item })
      },
      dropProduct(product) {
        setState({ id: product.id, state: withToBuy(product, false) })
        notify('toast.removedFromList', { name: product.name })
      },
      deleteItem(item) {
        deleteItemById(item.id)
        notify('toast.removedFromList', { name: item.name })
      },
    }),
    [setState, deleteItemById],
  )
}
