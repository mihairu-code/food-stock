import { useMutation } from '@tanstack/react-query'
import { useHouseholdId } from '@/app/session'
import { qk } from './keys'
import { queryClient } from './queryClient'

/** Мутация данных дома: после ответа сервера данные дома перечитываются. */
export function useHomeMutation<V, R = unknown>(mutationFn: (variables: V) => Promise<R>) {
  const hid = useHouseholdId()
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.home(hid) }),
  })
}
