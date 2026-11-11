import { useMemo } from 'react'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import { useHomeMutation } from '@/data/useHomeMutation'
import { withAvailability, withToBuy, type ProductState } from '@/domain/logic'
import type { Product } from '@/domain/types'

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
        toast(
          available
            ? `«${product.name}» снова дома`
            : state.to_buy
              ? `«${product.name}» закончился — добавлен в покупки`
              : `«${product.name}» закончился`,
        )
      },
      toggleList(product) {
        const toBuy = !product.to_buy
        setState({ id: product.id, state: withToBuy(product, toBuy) })
        toast(toBuy ? `«${product.name}» — в покупках` : `«${product.name}» убран из покупок`)
      },
      remove(product) {
        deleteProduct(product.id)
        toast(`«${product.name}» удалён`)
      },
    }),
    [setState, deleteProduct, toast],
  )
}
