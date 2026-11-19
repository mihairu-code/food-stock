import { useMemo } from 'react'
import { PURCHASED, useSetProductState, withToBuy } from '@/entities/product'
import { useDeleteShoppingItem } from '@/entities/shopping-item'
import { removeWithUndo, type Product, type ShoppingItem } from '@/shared/api'
import { openSheet } from '@/shared/ui'

/** Продукт дома куплен вместе с ручными позициями того же названия — одним тостом. */
const asBought = (product: Product, items: ShoppingItem[]) => ({
  id: product.id,
  kind: 'bought' as const,
  also: items.map((item) => ({ id: item.id, kind: 'shopping-item' as const })),
  message: 'toast.backHome' as const,
  params: { name: product.name },
})

export interface ShoppingActions {
  /**
   * Продукт дома куплен: он снова есть и уходит из списка, а с ним — ручные позиции
   * с тем же названием, оставшиеся от прежних версий. Покупку можно вернуть из тоста —
   * всё встанет на прежние места в списке.
   */
  buyProduct: (product: Product, manualTwins: ShoppingItem[]) => void
  /**
   * Ручная позиция куплена. Если дома есть продукт с тем же названием, отмечается он —
   * второй продукт не заводится; иначе шторка спрашивает, в какой раздел положить.
   */
  buyItem: (item: ShoppingItem, homeProduct: Product | undefined) => void
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
      buyProduct(product, manualTwins) {
        removeWithUndo({
          ...asBought(product, manualTwins),
          commit: async () => {
            await setStateAsync({ id: product.id, state: PURCHASED })
            await Promise.all(manualTwins.map((item) => deleteItemById(item.id)))
          },
        })
      },
      buyItem(item, homeProduct) {
        if (!homeProduct) return openSheet({ type: 'purchase', item })
        removeWithUndo({
          ...asBought(homeProduct, [item]),
          commit: async () => {
            await setStateAsync({ id: homeProduct.id, state: PURCHASED })
            await deleteItemById(item.id)
          },
        })
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
