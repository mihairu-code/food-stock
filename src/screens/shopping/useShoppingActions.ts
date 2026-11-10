import { useMemo } from 'react'
import { useSession } from '@/app/session'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import { useHomeMutation } from '@/data/useHomeMutation'
import type { Product, ShoppingItem } from '@/domain/types'

export interface ShoppingActions {
  /** Постоянный продукт куплен: он снова есть дома и уходит из списка. */
  buyProduct: (product: Product) => void
  /** Строка — сам продукт дома: удаляется он целиком, и из раздела тоже. */
  deleteProduct: (product: Product) => void
  removeItem: (item: ShoppingItem) => void
  purchaseItem: (item: ShoppingItem, sectionId: string, makeStaple: boolean) => void
}

/** Действия над строками списка покупок; объект стабилен — для memo-строк. */
export function useShoppingActions(): ShoppingActions {
  const { user } = useSession()
  const toast = useToast()
  const { mutate: setAvailability } = useHomeMutation(
    (id: string) => backend.setAvailability(id, true),
    (cache, id) =>
      cache.products((list) =>
        list.map((p) => (p.id === id ? { ...p, is_available: true, updated_at: new Date().toISOString() } : p)),
      ),
  )
  const { mutate: deleteProduct } = useHomeMutation(
    (id: string) => backend.deleteProduct(id),
    (cache, id) => cache.products((list) => list.filter((p) => p.id !== id)),
  )
  const { mutate: deleteItem } = useHomeMutation(
    (id: string) => backend.deleteShoppingItem(id),
    (cache, id) => cache.shoppingItems((list) => list.filter((i) => i.id !== id)),
  )
  const { mutate: purchase } = useHomeMutation(
    (v: { item: ShoppingItem; sectionId: string; makeStaple: boolean }) =>
      backend.purchaseShoppingItem(v.item.id, v.sectionId, v.makeStaple),
    (cache, { item, sectionId, makeStaple }) => {
      const now = new Date().toISOString()
      cache.shoppingItems((list) => list.filter((i) => i.id !== item.id))
      // Настоящий идентификатор продукт получит на сервере; до ответа строка временная.
      cache.products((list) => [
        ...list,
        {
          id: `pending-${item.id}`,
          household_id: item.household_id,
          section_id: sectionId,
          name: item.name,
          icon: item.icon,
          kind: makeStaple ? 'staple' : 'one_off',
          is_available: true,
          created_at: now,
          updated_at: now,
          created_by: user.id,
        },
      ])
    },
  )

  return useMemo(
    () => ({
      buyProduct(product) {
        setAvailability(product.id)
        toast(`«${product.name}» снова дома`)
      },
      deleteProduct(product) {
        deleteProduct(product.id)
        toast(`«${product.name}» удалён`)
      },
      removeItem(item) {
        deleteItem(item.id)
      },
      purchaseItem(item, sectionId, makeStaple) {
        purchase({ item, sectionId, makeStaple })
        toast(makeStaple ? `«${item.name}» теперь постоянный` : `«${item.name}» дома`)
      },
    }),
    [setAvailability, deleteProduct, deleteItem, purchase, toast],
  )
}
