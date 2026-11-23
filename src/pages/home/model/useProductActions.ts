import { useMemo } from 'react'
import { useDeleteProduct, useSetProductState, withAvailability, withToBuy } from '@/entities/product'
import { removeWithUndo, type Product } from '@/shared/api'
import { notify } from '@/shared/lib/toast'
import { openSheet } from '@/shared/ui'

export interface ProductActions {
  /** Нажатие на иконку: продукт закончился или снова дома. */
  toggleStock: (product: Product) => void
  /** Плюс и минус: положить в покупки или убрать из них, наличие не трогая. */
  toggleList: (product: Product) => void
  /** Шторка правки: название, иконка, раздел, «держать дома всегда». */
  edit: (product: Product) => void
  /** Удаление: продукт сразу пропадает, а тост несколько секунд предлагает его вернуть. */
  deleteProduct: (product: Product) => void
}

/**
 * Действия над продуктом на главном экране. Объект не меняется между рендерами,
 * поэтому memo-строки не перерисовываются, когда меняется чужой продукт.
 */
export function useProductActions(): ProductActions {
  const { mutate: setState } = useSetProductState()
  const { mutateAsync: deleteProductById } = useDeleteProduct()

  return useMemo(
    () => ({
      toggleStock(product) {
        const available = !product.is_available
        setState({ id: product.id, state: withAvailability(available) })
        notify(available ? 'toast.backHome' : 'toast.outToList', { name: product.name })
      },
      toggleList(product) {
        const toBuy = !product.to_buy
        setState({ id: product.id, state: withToBuy(product, toBuy) })
        notify(toBuy ? 'toast.addedToList' : 'toast.removedFromList', { name: product.name })
      },
      edit(product) {
        openSheet({ type: 'edit-product', product })
      },
      deleteProduct(product) {
        removeWithUndo({
          id: product.id,
          kind: 'product',
          commit: () => deleteProductById(product.id),
          message: 'toast.deleted',
          params: { name: product.name },
        })
      },
    }),
    [setState, deleteProductById],
  )
}
