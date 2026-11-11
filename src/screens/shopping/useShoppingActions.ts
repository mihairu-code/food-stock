import { useMemo } from 'react'
import { useSession } from '@/app/session'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import { useHomeMutation } from '@/data/useHomeMutation'
import { PURCHASED, withToBuy, type ProductState } from '@/domain/logic'
import type { Product, Section, ShoppingItem } from '@/domain/types'
import { useT } from '@/i18n'

export interface ShoppingActions {
  /** Продукт дома куплен: он снова есть и уходит из списка. */
  buyProduct: (product: Product) => void
  /** Убрать из покупок, не покупая: сам продукт и его наличие остаются как были. */
  dropProduct: (product: Product) => void
  removeItem: (item: ShoppingItem) => void
  purchaseItem: (item: ShoppingItem, section: Section, makeStaple: boolean) => void
}

/** Действия над строками списка покупок; объект стабилен — для memo-строк. */
export function useShoppingActions(): ShoppingActions {
  const t = useT()
  const { user } = useSession()
  const toast = useToast()
  const { mutate: setState } = useHomeMutation(
    ({ id, state }: { id: string; state: ProductState }) => backend.setProductState(id, state),
    (cache, { id, state }) =>
      cache.products((list) =>
        list.map((p) => (p.id === id ? { ...p, ...state, updated_at: new Date().toISOString() } : p)),
      ),
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
          to_buy: false,
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
        setState({ id: product.id, state: PURCHASED })
        toast(t('toast.backHome', { name: product.name }))
      },
      dropProduct(product) {
        setState({ id: product.id, state: withToBuy(product, false) })
        toast(t('toast.removedFromList', { name: product.name }))
      },
      removeItem(item) {
        deleteItem(item.id)
      },
      purchaseItem(item, section, makeStaple) {
        purchase({ item, sectionId: section.id, makeStaple })
        toast(t(makeStaple ? 'toast.purchasedStaple' : 'toast.purchasedOnce', { name: section.name }))
      },
    }),
    [setState, deleteItem, purchase, toast, t],
  )
}
