import { useMemo } from 'react'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import { useHomeMutation } from '@/data/useHomeMutation'
import type { Product } from '@/domain/types'

export interface ProductActions {
  toggleStock: (product: Product) => void
  remove: (product: Product) => void
}

/**
 * Действия над продуктом на главном экране. Объект не меняется между рендерами,
 * поэтому memo-строки не перерисовываются, когда меняется чужой продукт.
 */
export function useProductActions(): ProductActions {
  const toast = useToast()
  const { mutate: setAvailability } = useHomeMutation(
    (v: { id: string; available: boolean }) => backend.setAvailability(v.id, v.available),
    (cache, { id, available }) =>
      cache.products((list) =>
        list.map((p) => (p.id === id ? { ...p, is_available: available, updated_at: new Date().toISOString() } : p)),
      ),
  )
  const { mutate: deleteProduct } = useHomeMutation(
    (id: string) => backend.deleteProduct(id),
    (cache, id) => cache.products((list) => list.filter((p) => p.id !== id)),
  )

  return useMemo(
    () => ({
      toggleStock(product) {
        // Разовый продукт существует, только пока он есть дома: закончился — убираем.
        if (product.kind === 'one_off') {
          deleteProduct(product.id)
          toast(`«${product.name}» закончился и убран`)
          return
        }
        const available = !product.is_available
        setAvailability({ id: product.id, available })
        toast(available ? `«${product.name}» снова дома` : `«${product.name}» — в покупках`)
      },
      remove(product) {
        deleteProduct(product.id)
        toast(`«${product.name}» удалён`)
      },
    }),
    [setAvailability, deleteProduct, toast],
  )
}
