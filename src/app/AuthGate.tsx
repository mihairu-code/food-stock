import { useQuery } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import { queryClient } from '@/data/queryClient'
import type { User } from '@/domain/types'
import { SignIn } from './SignIn'

/** Решает, кто пользуется приложением: без входа показывает экран входа по почте. */
export function AuthGate({ children }: { children: (user: User) => ReactNode }) {
  const user = useQuery({ queryKey: qk.user, queryFn: () => backend.currentUser(), staleTime: Infinity })

  useEffect(
    () =>
      backend.onAuthChange(() => {
        // Приватные данные не должны пережить смену пользователя.
        queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== qk.user[0] })
        void queryClient.invalidateQueries({ queryKey: qk.user })
      }),
    [],
  )

  if (user.isPending) return <p className="status">Загрузка…</p>
  if (user.isError) {
    return (
      <div className="notice">
        <h2>Не удалось начать работу</h2>
        <p>Проверьте соединение и попробуйте ещё раз.</p>
        <button className="btn" type="button" onClick={() => void user.refetch()}>
          Повторить
        </button>
      </div>
    )
  }
  // Раньше здесь висела «Загрузка…» навсегда: null — это не «ещё грузится», а «не вошёл».
  if (!user.data) return <SignIn />
  return children(user.data)
}
