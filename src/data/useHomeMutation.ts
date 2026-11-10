import { useMutation } from '@tanstack/react-query'
import { useHouseholdId } from '@/app/session'
import { useToast } from '@/components/toastContext'
import type { Product, Section, ShoppingItem } from '@/domain/types'
import { qk } from './keys'
import { queryClient } from './queryClient'

type ListPatch<T> = (change: (list: T[]) => T[]) => void

export interface CachePatch {
  sections: ListPatch<Section>
  products: ListPatch<Product>
  shoppingItems: ListPatch<ShoppingItem>
}

const homeMutationKey = (hid: string) => ['home-mutation', hid] as const

const patchList =
  <T>(key: readonly unknown[]): ListPatch<T> =>
  (change) =>
    queryClient.setQueryData<T[]>(key, (old) => (old ? change(old) : old))

/**
 * Мутация данных дома. Кэш правится сразу (optimistic), запрос уходит следом;
 * при ошибке кэш откатывается, а в конце данные перечитываются с сервера.
 *
 * Мутации одного дома выполняются строго по очереди (scope): «добавил продукт и
 * тут же отметил, что он закончился» дойдёт до сервера в том же порядке.
 */
export function useHomeMutation<V, R = unknown>(
  mutationFn: (variables: V) => Promise<R>,
  optimistic: (cache: CachePatch, variables: V) => void,
) {
  const hid = useHouseholdId()
  const toast = useToast()

  return useMutation({
    mutationKey: homeMutationKey(hid),
    scope: { id: `home:${hid}` },
    mutationFn,
    onMutate: async (variables: V) => {
      await queryClient.cancelQueries({ queryKey: qk.home(hid) })
      const snapshot = {
        sections: queryClient.getQueryData<Section[]>(qk.sections(hid)),
        products: queryClient.getQueryData<Product[]>(qk.products(hid)),
        shoppingItems: queryClient.getQueryData<ShoppingItem[]>(qk.shoppingItems(hid)),
      }
      optimistic(
        {
          sections: patchList<Section>(qk.sections(hid)),
          products: patchList<Product>(qk.products(hid)),
          shoppingItems: patchList<ShoppingItem>(qk.shoppingItems(hid)),
        },
        variables,
      )
      return snapshot
    },
    onError: (_error, _variables, snapshot) => {
      if (snapshot) {
        queryClient.setQueryData(qk.sections(hid), snapshot.sections)
        queryClient.setQueryData(qk.products(hid), snapshot.products)
        queryClient.setQueryData(qk.shoppingItems(hid), snapshot.shoppingItems)
      }
      toast('Не удалось сохранить. Проверьте соединение.')
    },
    onSettled: () => {
      // Пока в очереди есть другие правки, серверный ответ затёр бы их оптимистичное
      // состояние; перечитываем только после последней.
      if (queryClient.isMutating({ mutationKey: homeMutationKey(hid) }) > 1) return
      return queryClient.invalidateQueries({ queryKey: qk.home(hid) })
    },
  })
}
