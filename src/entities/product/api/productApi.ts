import {
  backend,
  placeProducts,
  useHomeMutation,
  withState,
  type NewProduct,
  type ProductState,
} from '@/shared/api'
import { useSession } from '@/shared/session'

export function useCreateProduct() {
  const { household, user } = useSession()
  const householdId = household.id
  return useHomeMutation(
    (input: NewProduct) => backend.createProduct(householdId, input),
    (cache, input) => {
      const now = new Date().toISOString()
      cache.products((list) => [
        ...list,
        {
          ...input,
          household_id: householdId,
          is_available: true,
          to_buy: false,
          created_at: now,
          updated_at: now,
          created_by: user.id,
        },
      ])
    },
  )
}

export function useSetProductState() {
  return useHomeMutation(
    ({ id, state }: { id: string; state: ProductState }) => backend.setProductState(id, state),
    (cache, { id, state }) =>
      cache.products((list) =>
        list.map((product) => (product.id === id ? withState(product, state, new Date().toISOString()) : product)),
      ),
  )
}

export function useDeleteProduct() {
  return useHomeMutation(
    (productId: string) => backend.deleteProduct(productId),
    (cache, productId) => cache.products((list) => list.filter((product) => product.id !== productId)),
  )
}

/**
 * Раздел после перетаскивания: его продукты в новом порядке. Перенос из другого
 * раздела — тот же вызов: перенесённый продукт просто стоит в списке.
 */
export function useReorderProducts() {
  return useHomeMutation(
    (order: { sectionId: string; productIds: string[] }) => backend.reorderProducts(order.sectionId, order.productIds),
    (cache, { sectionId, productIds }) => cache.products((list) => placeProducts(list, sectionId, productIds)),
  )
}
