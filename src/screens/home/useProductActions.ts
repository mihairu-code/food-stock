import { useMemo } from 'react'
import { useDeleteProduct, useSetProductState } from '@/data/hooks'
import { withAvailability, withToBuy } from '@/domain/logic'
import type { Product } from '@/domain/types'
import { notify } from '@/lib/toast'

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
  const { mutate: setState } = useSetProductState()
  const { mutate: deleteProduct } = useDeleteProduct()

  return useMemo(
    () => ({
      toggleStock(product) {
        const available = !product.is_available
        const state = withAvailability(product, available)
        setState({ id: product.id, state })
        notify(available ? 'toast.backHome' : state.to_buy ? 'toast.outToList' : 'toast.out', {
          name: product.name,
        })
      },
      toggleList(product) {
        const toBuy = !product.to_buy
        setState({ id: product.id, state: withToBuy(product, toBuy) })
        notify(toBuy ? 'toast.addedToList' : 'toast.removedFromList', { name: product.name })
      },
      remove(product) {
        deleteProduct(product.id)
        notify('toast.deleted', { name: product.name })
      },
    }),
    [setState, deleteProduct],
  )
}
