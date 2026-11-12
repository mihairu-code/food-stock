import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Notice, Splash } from '@/components'
import { backend } from '@/data'
import { qk } from '@/data/hooks'
import { queryClient } from '@/data/queryClient'
import type { User } from '@/domain/types'
import { useT } from '@/i18n'
import { Welcome } from './Welcome'

/**
 * Решает, кто пользуется приложением. Если на устройстве уже есть сессия — берём её.
 * Иначе предлагаем войти через Google или продолжить без аккаунта; пока вход через
 * Google на сервере не настроен, анонимный пользователь создаётся сразу.
 */
export function AuthGate({ children }: { children: (user: User) => ReactNode }) {
  const t = useT()
  const [anonymousChosen, setAnonymousChosen] = useState(false)
  const user = useQuery({
    queryKey: [...qk.user, anonymousChosen],
    queryFn: async () => {
      const current = await backend.currentUser()
      if (current) return current
      if (anonymousChosen || !(await backend.googleAvailable())) return backend.continueAnonymously()
      return null
    },
    staleTime: Infinity,
    retry: false,
  })

  useEffect(() => backend.onAuthChange(() => void queryClient.invalidateQueries({ queryKey: qk.user })), [])

  // Приватные данные не должны пережить смену пользователя.
  const userId = user.data?.id ?? null
  const lastUserId = useRef(userId)
  useEffect(() => {
    if (userId && lastUserId.current && lastUserId.current !== userId) {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== qk.user[0] })
    }
    if (userId) lastUserId.current = userId
  }, [userId])

  if (user.isPending) return <Splash />
  if (user.isError) {
    return (
      <Notice title={t('start.errorTitle')} actionLabel={t('common.retry')} onAction={() => void user.refetch()}>
        {t('common.checkConnection')}
        <small className="notice-detail">{user.error.message}</small>
      </Notice>
    )
  }
  if (!user.data) return <Welcome onContinue={() => setAnonymousChosen(true)} />
  return children(user.data)
}
