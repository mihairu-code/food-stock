import { useMemo } from 'react'
import { useDeleteProduct, useSetProductState, withAvailability, withToBuy } from '@/entities/product'
import { removeWithUndo, type Product } from '@/shared/api'
import { useAppearance } from '@/shared/lib/appearance'
import { isCoachSeen, markCoachSeen } from '@/shared/lib/coach/coach'
import { noteMarkedOut, noteOneOffDeleted } from '@/shared/lib/coach/tips'
import { notify } from '@/shared/lib/toast'
import { openSheet } from '@/shared/ui'

/** Отметка «длинный тост после первого плюса уже был» — в общем списке показанных подсказок. */
const FIRST_PLUS_TOAST = 'first-plus-toast'
/** Продукт удалили меньше чем через неделю после добавления — похоже на разовую покупку (совет 1). */
const ONE_OFF_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

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
  const { colorSafe } = useAppearance()

  return useMemo(
    () => ({
      toggleStock(product) {
        const available = !product.is_available
        setState({ id: product.id, state: withAvailability(available) })
        if (!available) noteMarkedOut(product.id)
        notify(available ? 'toast.backHome' : 'toast.outToList', { name: product.name })
      },
      toggleList(product) {
        const toBuy = !product.to_buy
        setState({ id: product.id, state: withToBuy(product, toBuy) })
        // Первый плюс у продукта, который есть дома, объясняет оранжевую точку — один раз.
        if (toBuy && product.is_available && !isCoachSeen(FIRST_PLUS_TOAST)) {
          markCoachSeen(FIRST_PLUS_TOAST)
          notify(colorSafe ? 'toast.addedToListFirstSafe' : 'toast.addedToListFirst', { name: product.name })
          return
        }
        notify(toBuy ? 'toast.addedToList' : 'toast.removedFromList', { name: product.name })
      },
      edit(product) {
        openSheet({ type: 'edit-product', product })
      },
      deleteProduct(product) {
        if (Date.now() - Date.parse(product.created_at) < ONE_OFF_DAYS * DAY_MS) noteOneOffDeleted()
        removeWithUndo({
          id: product.id,
          kind: 'product',
          commit: () => deleteProductById(product.id),
          message: 'toast.deleted',
          params: { name: product.name },
        })
      },
    }),
    [setState, deleteProductById, colorSafe],
  )
}
