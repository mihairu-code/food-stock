import { backend, placeShopping, useHomeMutation } from '@/shared/api'

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

