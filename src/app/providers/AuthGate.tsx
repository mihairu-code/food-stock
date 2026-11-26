import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { readInviteToken } from '@/entities/invite'
import { WelcomePage } from '@/pages/welcome'
import { backend, dropSnapshot, openSnapshot, queryClient, type User } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { Notice, StatusNote } from '@/shared/ui'

type AuthState =
  | { status: 'loading' }
  | { status: 'error'; detail: string }
  | { status: 'welcome' }
  | { status: 'ready'; user: User }

const sameUser = (a: User, b: User) =>
  a.id === b.id && a.isAnonymous === b.isAnonymous && a.email === b.email && a.avatarUrl === b.avatarUrl

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

  const acceptUser = useCallback((user: User) => {
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

  const showStartError = useCallback((error: unknown) => {
    if (!mounted.current) return
    setState({ status: 'error', detail: error instanceof Error ? error.message : String(error) })
  }, [])

  const resolveUser = useCallback(() => {
    backend
      .currentUser()
      .then(async (user) => {
        if (user) return acceptUser(user)
        // Настроен ли вход через Google, нужно знать только новому человеку: тот, у кого
        // уже есть сессия, не ждёт при запуске лишний запрос к серверу.
        if (!(await backend.googleAvailable())) return acceptUser(await backend.continueAnonymously())
        if (!mounted.current) return
        queryClient.clear()
        dropSnapshot()
        lastUserId.current = null
        setState({ status: 'welcome' })
      })
      .catch(showStartError)
  }, [acceptUser, showStartError])

  useEffect(() => {
    mounted.current = true

    // Google вернул ошибку (например, человек закрыл окно входа) — убираем её из адреса.
    const params = new URLSearchParams(window.location.search)
    if (params.has('error') || params.has('error_code')) {
      notify('toast.googleFailed')
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    }

    resolveUser()
    const unsubscribe = backend.onAuthChange(resolveUser)
    return () => {
      mounted.current = false
      unsubscribe()
    }
  }, [resolveUser])

  function retryStart(action: () => void) {
    setState({ status: 'loading' })
    action()
  }

  if (state.status === 'loading') return <StatusNote fullscreen loading="fridge" />
  if (state.status === 'welcome') {
    return (
      <WelcomePage
        invited={invited}
        onContinue={() => retryStart(() => backend.continueAnonymously().then(acceptUser, showStartError))}
      />
    )
  }
  if (state.status === 'error') {
    return (
      <Notice title={t('start.errorTitle')} actionLabel={t('common.retry')} onAction={() => retryStart(resolveUser)}>
        {t('common.checkConnection')}
        <small className="notice-detail">{state.detail}</small>
      </Notice>
    )
  }
  return children(state.user)
}
