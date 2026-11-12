import { useSession } from '@/app/session'
import { backend } from '@/data'
import type { NewProduct } from '@/data/backend'
import type { ProductState } from '@/domain/logic'
import { useHomeMutation } from './useHomeMutation'

export function useCreateProduct() {
  const { household, user } = useSession()
  const hid = household.id
  return useHomeMutation(
    (input: NewProduct) => backend.createProduct(hid, input),
    (cache, input) => {
      const now = new Date().toISOString()
      cache.products((list) => [
        ...list,
        {
          ...input,
          household_id: hid,
          is_available: true,
          to_buy: false,
          created_at: now,
          updated_at: now,
          created_by: user.id,
        },
      ])
    },
  )
}

export function useSetProductState() {
  return useHomeMutation(
    ({ id, state }: { id: string; state: ProductState }) => backend.setProductState(id, state),
    (cache, { id, state }) =>
      cache.products((list) =>
        list.map((p) => (p.id === id ? { ...p, ...state, updated_at: new Date().toISOString() } : p)),
      ),
  )
}

export function useDeleteProduct() {
  return useHomeMutation(
    (productId: string) => backend.deleteProduct(productId),
    (cache, productId) => cache.products((list) => list.filter((p) => p.id !== productId)),
  )
}
