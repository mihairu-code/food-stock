import { useMutation, type QueryKey } from '@tanstack/react-query'
import { queryClient } from '@/data/queryClient'
import type { MessageKey } from '@/i18n'
import { notify } from '@/lib/toast'

interface ActionOptions {
  /** Тост об успехе. */
  done?: MessageKey
  /** Тост об ошибке; null — вызывающий код сообщает об ошибке сам. */
  failed?: MessageKey | null
  /** Что перечитать, когда действие завершилось: ключ кэша или 'all' — всё. */
  refresh?: QueryKey | 'all'
}

/**
 * Разовое действие без оптимистичного обновления: приглашения, участники, аккаунт.
 * Тосты и перечитывание описываются здесь же, поэтому экрану остаётся вызвать mutate.
 * Они срабатывают, даже если компонент (шторка) к ответу сервера уже закрыт.
 */
export function useAction<V = void, R = unknown>(
  run: (variables: V) => Promise<R>,
  { done, failed = 'common.actionError', refresh }: ActionOptions = {},
) {
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      if (done) notify(done)
    },
    onError: () => {
      if (failed) notify(failed)
    },
    onSettled: () => {
      if (refresh) return queryClient.invalidateQueries(refresh === 'all' ? undefined : { queryKey: refresh })
    },
  })
}
