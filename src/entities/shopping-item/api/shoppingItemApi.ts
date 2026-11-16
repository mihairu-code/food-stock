import type { NewShoppingItem } from '@/shared/api/backend'
import { backend } from '@/shared/api/currentBackend'
import { placeShopping } from '@/shared/api/homeDataRules'
import type { ShoppingItem } from '@/shared/api/types'
import { useHomeMutation } from '@/shared/api/useHomeMutation'
import { useSession } from '@/shared/session/session'

/** Продукт, только что перенесённый из покупок, до ответа сервера живёт под временным идентификатором. */
const PENDING_PREFIX = 'pending:'

export const isPendingProduct = (productId: string): boolean => productId.startsWith(PENDING_PREFIX)

export function useCreateShoppingItem() {
  const { household, user } = useSession()
  const hid = household.id
  return useHomeMutation(
    (input: NewShoppingItem) => backend.createShoppingItem(hid, input),
    (cache, input) =>
      cache.shoppingItems((list) => [
        ...list,
        { ...input, household_id: hid, created_at: new Date().toISOString(), created_by: user.id },
      ]),
  )
}

export function useDeleteShoppingItem() {
  return useHomeMutation(
    (itemId: string) => backend.deleteShoppingItem(itemId),
    (cache, itemId) => cache.shoppingItems((list) => list.filter((i) => i.id !== itemId)),
  )
}

export function usePurchaseShoppingItem() {
  const userId = useSession().user.id
  return useHomeMutation(
    (v: { item: ShoppingItem; sectionId: string; makeStaple: boolean }) =>
      backend.purchaseShoppingItem(v.item.id, v.sectionId, v.makeStaple),
    (cache, { item, sectionId, makeStaple }) => {
      const now = new Date().toISOString()
      cache.shoppingItems((list) => list.filter((i) => i.id !== item.id))
      // Настоящий идентификатор продукта выдаст сервер.
      cache.products((list) => [
        ...list,
        {
          id: `${PENDING_PREFIX}${item.id}`,
          household_id: item.household_id,
          section_id: sectionId,
          name: item.name,
          icon: item.icon,
          kind: makeStaple ? 'staple' : 'one_off',
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
