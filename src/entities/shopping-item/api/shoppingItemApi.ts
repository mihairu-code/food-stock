import {
  backend,
  NEW_PRODUCT_KIND,
  pendingProductId,
  useHomeMutation,
  type NewShoppingItem,
  type ShoppingItem,
  type ShoppingItemPatch,
} from '@/shared/api'
import { useSession } from '@/shared/session'

export function useCreateShoppingItem() {
  const { household, user } = useSession()
  const householdId = household.id
  return useHomeMutation(
    (input: NewShoppingItem) => backend.createShoppingItem(householdId, input),
    (cache, input) =>
      cache.shoppingItems((list) => [
        ...list,
        { ...input, household_id: householdId, created_at: new Date().toISOString(), created_by: user.id },
      ]),
  )
}

/** Название и иконка ручной позиции; место в списке не меняется. */
export function useEditShoppingItem() {
  return useHomeMutation(
    ({ id, patch }: { id: string; patch: ShoppingItemPatch }) => backend.updateShoppingItem(id, patch),
    (cache, { id, patch }) =>
      cache.shoppingItems((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item))),
  )
}

export function useDeleteShoppingItem() {
  return useHomeMutation(
    (itemId: string) => backend.deleteShoppingItem(itemId),
    (cache, itemId) => cache.shoppingItems((list) => list.filter((item) => item.id !== itemId)),
  )
}

/** Ручная позиция куплена и становится продуктом раздела — атомарно, одним вызовом сервера. */
export function usePurchaseShoppingItem() {
  const userId = useSession().user.id
  return useHomeMutation(
    (purchase: { item: ShoppingItem; sectionId: string }) =>
      backend.purchaseShoppingItem(purchase.item.id, purchase.sectionId),
    (cache, { item, sectionId }) => {
      const now = new Date().toISOString()
      cache.shoppingItems((list) => list.filter((candidate) => candidate.id !== item.id))
      cache.products((list) => [
        ...list,
        {
          id: pendingProductId(item.id),
          household_id: item.household_id,
          section_id: sectionId,
          name: item.name,
          icon: item.icon,
          kind: NEW_PRODUCT_KIND,
          is_available: true,
          to_buy: false,
          created_at: now,
          updated_at: now,
          created_by: userId,
        },
      ])
    },
  )
}
