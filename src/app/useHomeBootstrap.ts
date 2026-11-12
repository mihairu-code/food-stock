import { useEffect, useRef, useState } from 'react'
import { backend } from '@/data'
import { queryClient } from '@/data/queryClient'
import { translate } from '@/i18n'
import { clearInviteToken, readInviteToken } from '@/lib/invite'
import { notify } from '@/lib/toast'

type Bootstrap = 'idle' | 'joining' | 'creating' | 'join-failed' | 'create-failed'

interface BootstrapInput {
  /** Список домов получен с сервера (снимок прошлого запуска не считается). */
  ready: boolean
  hasHome: boolean
  displayName: string
  /** Дом, в который человек вступил или который для него создан. */
  onHome: (householdId: string) => void
}

/**
 * Первые шаги в приложении: при запуске по ссылке-приглашению вступаем в чужой дом;
 * если домов у пользователя нет вовсе — создаём ему первый.
 */
export function useHomeBootstrap({ ready, hasHome, displayName, onHome }: BootstrapInput) {
  const [inviteToken, setInviteToken] = useState(() =>
    backend.mode === 'supabase' ? readInviteToken() : null,
  )
  const [status, setStatus] = useState<Bootstrap>('idle')
  // Ref, а не состояние: двойной вызов эффекта в StrictMode не должен создать два дома.
  const busy = useRef(false)

  useEffect(() => {
    if (!ready || busy.current) return

    async function run(step: 'joining' | 'creating', action: () => Promise<string>) {
      busy.current = true
      setStatus(step)
      try {
        onHome(await action())
        if (step === 'joining') notify('toast.joined')
        await queryClient.invalidateQueries()
        setStatus('idle')
      } catch {
        setStatus(step === 'joining' ? 'join-failed' : 'create-failed')
      } finally {
        if (step === 'joining') {
          clearInviteToken()
          setInviteToken(null)
        }
        busy.current = false
      }
    }

    if (inviteToken) {
      void run('joining', () => backend.joinHousehold(inviteToken, displayName))
    } else if (!hasHome && status === 'idle') {
      void run('creating', () => backend.createHousehold(translate('home.defaultName'), displayName))
    }
  }, [ready, hasHome, inviteToken, status, displayName, onHome])

  return {
    status,
    joining: inviteToken !== null || status === 'joining',
    /** После ошибки: попробовать снова или продолжить без вступления. */
    reset: () => setStatus('idle'),
  }
}
