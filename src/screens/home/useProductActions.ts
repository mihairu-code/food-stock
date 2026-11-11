import { useMemo } from 'react'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import { useHomeMutation } from '@/data/useHomeMutation'
import { withAvailability, withToBuy, type ProductState } from '@/domain/logic'
import type { Product } from '@/domain/types'
import { useT } from '@/i18n'

export interface ProductActions {
  /** Нажатие на иконку или название: продукт закончился или снова дома. */
  toggleStock: (product: Product) => void
  /** Плюс и минус: положить в покупки или убрать из них, наличие не трогая. */
  toggleList: (product: Product) => void
  remove: (product: Product) => void
}

/**
 * Действия над продуктом на главном экране. Объект не меняется между рендерами,
 * поэтому memo-строки не перерисовываются, когда меняется чужой продукт.
 */
export function useProductActions(): ProductActions {
  const t = useT()
  const toast = useToast()
  const { mutate: setState } = useHomeMutation(
    ({ id, state }: { id: string; state: ProductState }) => backend.setProductState(id, state),
    (cache, { id, state }) =>
      cache.products((list) =>
        list.map((p) => (p.id === id ? { ...p, ...state, updated_at: new Date().toISOString() } : p)),
      ),
  )
  const { mutate: deleteProduct } = useHomeMutation(
    (id: string) => backend.deleteProduct(id),
    (cache, id) => cache.products((list) => list.filter((p) => p.id !== id)),
  )

  return useMemo(
    () => ({
      toggleStock(product) {
        const available = !product.is_available
        const state = withAvailability(product, available)
        setState({ id: product.id, state })
        toast(t(available ? 'toast.backHome' : state.to_buy ? 'toast.outToList' : 'toast.out', { name: product.name }))
      },
      toggleList(product) {
        const toBuy = !product.to_buy
        setState({ id: product.id, state: withToBuy(product, toBuy) })
        toast(t(toBuy ? 'toast.addedToList' : 'toast.removedFromList', { name: product.name }))
      },
      remove(product) {
        deleteProduct(product.id)
        toast(t('toast.deleted', { name: product.name }))
      },
    }),
    [setState, deleteProduct, toast, t],
  )
}
