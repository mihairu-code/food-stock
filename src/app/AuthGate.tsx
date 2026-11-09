import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import type { User } from '@/domain/types'

/**
 * Регистрации нет: если на устройстве уже есть сессия — берём её, иначе незаметно
 * создаём анонимного пользователя.
 */
export function AuthGate({ children }: { children: (user: User) => ReactNode }) {
  const user = useQuery({
    queryKey: qk.user,
    queryFn: async () => (await backend.currentUser()) ?? (await backend.continueAnonymously()),
    staleTime: Infinity,
    retry: false,
  })

  if (user.isPending) return <p className="status">Загрузка…</p>
  if (user.isError) {
    return (
      <div className="notice">
        <h2>Не удалось начать работу</h2>
        <p>Проверьте соединение и попробуйте ещё раз.</p>
        <small className="notice-detail">{user.error.message}</small>
        <button className="btn" type="button" onClick={() => void user.refetch()}>
          Повторить
        </button>
      </div>
    )
  }
  return children(user.data)
}
