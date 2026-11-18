import { useMemo } from 'react'
import { PURCHASED, useSetProductState, withToBuy } from '@/entities/product'
import { useDeleteShoppingItem } from '@/entities/shopping-item'
import { removeWithUndo, type Product, type ShoppingItem } from '@/shared/api'
import { openSheet } from '@/shared/ui'

export interface ShoppingActions {
  /**
   * Продукт дома куплен: он снова есть и уходит из списка. Покупку можно вернуть
   * из тоста — продукт встанет на прежнее место в списке.
   */
  buyProduct: (product: Product) => void
  /** Ручная позиция куплена: шторка спрашивает, в какой раздел её положить. */
  buyItem: (item: ShoppingItem) => void
  /**
   * Убрать из покупок, не покупая: сам продукт и его наличие остаются как были.
   * Как и удаление ручной позиции, это можно вернуть из тоста.
   */
  dropProduct: (product: Product) => void
  /** Продукт дома правится той же шторкой, что и на главном экране. */
  editProduct: (product: Product) => void
  editItem: (item: ShoppingItem) => void
  deleteItem: (item: ShoppingItem) => void
}

/** Действия над строками списка покупок; объект стабилен — для memo-строк. */
export function useShoppingActions(): ShoppingActions {
  const { mutateAsync: setStateAsync } = useSetProductState()
  const { mutateAsync: deleteItemById } = useDeleteShoppingItem()

  return useMemo<ShoppingActions>(
    () => ({
      buyProduct(product) {
        removeWithUndo({
          id: product.id,
          kind: 'bought',
          commit: () => setStateAsync({ id: product.id, state: PURCHASED }),
          message: 'toast.backHome',
          params: { name: product.name },
        })
      },
      buyItem(item) {
        openSheet({ type: 'purchase', item })
      },
      dropProduct(product) {
        removeWithUndo({
          id: product.id,
          kind: 'from-list',
          commit: () => setStateAsync({ id: product.id, state: withToBuy(product, false) }),
          message: 'toast.removedFromList',
          params: { name: product.name },
        })
      },
      editProduct(product) {
        openSheet({ type: 'edit-product', product })
      },
      editItem(item) {
        openSheet({ type: 'edit-item', item })
      },
      deleteItem(item) {
        removeWithUndo({
          id: item.id,
          kind: 'shopping-item',
          commit: () => deleteItemById(item.id),
          message: 'toast.removedFromList',
          params: { name: item.name },
        })
      },
    }),
    [setStateAsync, deleteItemById],
  )
}
