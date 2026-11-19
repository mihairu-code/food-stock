import {
  backend,
  placeShopping,
  useHomeMutation,
  withState,
  type ProductState,
  type ShoppingItem,
} from '@/shared/api'

/** Список покупок в новом порядке после перетаскивания: идентификаторы строк сверху вниз. */
export function useReorderShopping() {
  return useHomeMutation(
    (ids: string[]) => backend.reorderShopping(ids),
    (cache, ids) => {
      // Места раскладываются по двум спискам: продукты дома и ручные позиции.
      cache.products((products) => placeShopping({ products, shoppingItems: [] }, ids).products)
      cache.shoppingItems((shoppingItems) => placeShopping({ products: [], shoppingItems }, ids).shoppingItems)
    },
  )
}

export interface ItemReplacement {
  /** Ручная позиция, которую заменяет продукт дома с тем же названием. */
  item: ShoppingItem
  productId: string
  /** Отметки продукта, если его ещё нужно положить в покупки; уже лежащий — не передаётся. */
  state?: ProductState
  /** Список покупок после замены: идентификаторы сверху вниз, продукт — на месте позиции. */
  order: string[]
}

/**
 * Продукт дома занимает место ручной позиции с тем же названием: одно название — одна
 * вещь. Продукт ложится в покупки на её место, сама позиция удаляется. Вызывается сразу
 * после создания или переименования продукта — мутации идут строго по очереди.
 */
export function useReplaceItemWithProduct() {
  return useHomeMutation(
    async ({ item, productId, state, order }: ItemReplacement) => {
      if (state) await backend.setProductState(productId, state)
      await backend.reorderShopping(order)
      await backend.deleteShoppingItem(item.id)
    },
    (cache, { item, productId, state, order }) => {
      const now = new Date().toISOString()
      cache.products((products) => {
        const listed = state
          ? products.map((product) => (product.id === productId ? withState(product, state, now) : product))
          : products
        return placeShopping({ products: listed, shoppingItems: [] }, order).products
      })
      cache.shoppingItems((shoppingItems) => {
        const left = shoppingItems.filter((candidate) => candidate.id !== item.id)
        return placeShopping({ products: [], shoppingItems: left }, order).shoppingItems
      })
    },
  )
}
