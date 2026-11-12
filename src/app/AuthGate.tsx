import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Notice, Splash } from '@/components'
import { backend } from '@/data'
import { queryClient } from '@/data/queryClient'
import { dropSnapshot, openSnapshot } from '@/data/snapshot'
import type { User } from '@/domain/types'
import { useT } from '@/i18n'
import { readInviteToken } from '@/lib/invite'
import { notify } from '@/lib/toast'
import { Welcome } from './Welcome'

type AuthState =
  | { status: 'loading' }
  | { status: 'error'; detail: string }
  | { status: 'welcome' }
  | { status: 'ready'; user: User }

const sameUser = (a: User, b: User) =>
  a.id === b.id && a.isAnonymous === b.isAnonymous && a.email === b.email

/**
 * Решает, кто пользуется приложением. Если на устройстве уже есть сессия — берём её.
 * Иначе предлагаем войти через Google или продолжить без аккаунта; пока вход через
 * Google на сервере не настроен, анонимный пользователь создаётся сразу.
 */
export function AuthGate({ children }: { children: (user: User) => ReactNode }) {
  const t = useT()
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const lastUserId = useRef<string | null>(null)
  const mounted = useRef(true)
  const [invited] = useState(() => backend.mode === 'supabase' && readInviteToken() !== null)

  const accept = useCallback((user: User) => {
    if (!mounted.current) return
    if (lastUserId.current !== user.id) {
      // Приватные данные не должны пережить смену пользователя.
      if (lastUserId.current !== null) queryClient.clear()
      // В демо-режиме данные и так лежат на устройстве — снимок не нужен.
      if (backend.mode === 'supabase') openSnapshot(user.id)
      lastUserId.current = user.id
    }
    setState((current) =>
      current.status === 'ready' && sameUser(current.user, user) ? current : { status: 'ready', user },
    )
  }, [])

  const fail = useCallback((error: unknown) => {
    if (!mounted.current) return
    setState({ status: 'error', detail: error instanceof Error ? error.message : String(error) })
  }, [])

  const refresh = useCallback(() => {
    backend
      .currentUser()
      .then(async (user) => {
        if (user) return accept(user)
        // Настроен ли вход через Google, нужно знать только новому человеку: тот, у кого
        // уже есть сессия, не ждёт при запуске лишний запрос к серверу.
        if (!(await backend.googleAvailable())) return accept(await backend.continueAnonymously())
        if (!mounted.current) return
        queryClient.clear()
        dropSnapshot()
        lastUserId.current = null
        setState({ status: 'welcome' })
      })
      .catch(fail)
  }, [accept, fail])

  useEffect(() => {
    mounted.current = true

    // Google вернул ошибку (например, человек закрыл окно входа) — убираем её из адреса.
    const params = new URLSearchParams(window.location.search)
    if (params.has('error') || params.has('error_code')) {
      notify('toast.googleFailed')
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    }

    refresh()
    const unsubscribe = backend.onAuthChange(refresh)
    return () => {
      mounted.current = false
      unsubscribe()
    }
  }, [refresh])

  function retry(action: () => void) {
    setState({ status: 'loading' })
    action()
  }

  if (state.status === 'loading') return <Splash />
  if (state.status === 'welcome') {
    return (
      <Welcome
        invited={invited}
        onContinue={() => retry(() => backend.continueAnonymously().then(accept, fail))}
      />
    )
  }
  if (state.status === 'error') {
    return (
      <Notice title={t('start.errorTitle')} actionLabel={t('common.retry')} onAction={() => retry(refresh)}>
        {t('common.checkConnection')}
        <small className="notice-detail">{state.detail}</small>
      </Notice>
    )
  }
  return children(state.user)
}
