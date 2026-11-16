import { useQuery } from '@tanstack/react-query'
import { backend, qk, useAction } from '@/shared/api'
import { saveMergeTicket } from '@/shared/lib/mergeTicket'
import { useSession } from '@/shared/session'

/** Настроен ли на сервере вход через Google. */
export function useGoogleAvailable(): boolean {
  const google = useQuery({
    queryKey: qk.googleAvailable,
    queryFn: () => backend.googleAvailable(),
    staleTime: Infinity,
  })
  return google.data === true
}

/**
 * Вход через Google с этого устройства. Билет помечает анонимного пользователя:
 * после входа всё, что он успел завести, перейдёт в аккаунт.
 */
export function useGoogleSignIn() {
  const userId = useSession().user.id
  return useAction(
    async () => {
      saveMergeTicket({ token: await backend.createMergeTicket(), userId })
      await backend.signInWithGoogle()
    },
    { failed: 'toast.googleError' },
  )
}

export function useSignOut() {
  return useAction(() => backend.signOut())
}

/** Только демо-режим: вернуть данные к исходным. */
export function useResetLocalData() {
  return useAction(async () => backend.resetLocalData?.(), {
    done: 'toast.demoRestored',
    failed: null,
    refresh: 'all',
  })
}
