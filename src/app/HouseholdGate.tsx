import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import { queryClient } from '@/data/queryClient'
import type { User } from '@/domain/types'
import { translate, useT } from '@/i18n'
import { firstName } from '@/lib/firstName'
import { preferredHousehold, rememberHousehold } from '@/lib/household'
import { clearInviteToken, readInviteToken, savedName } from '@/lib/invite'
import { SessionContext, type Session } from './session'
import { useProfileSync } from './useProfileSync'
import { useRealtimeRefresh } from './useRealtimeRefresh'

type Bootstrap = 'idle' | 'joining' | 'creating' | 'join-failed' | 'create-failed'

/**
 * Находит дом пользователя. При запуске по ссылке-приглашению вступает в чужой дом;
 * если домов нет вовсе — создаёт первый.
 */
export function HouseholdGate({ user, children }: { user: User; children: ReactNode }) {
  const t = useT()
  const memberships = useQuery({ queryKey: qk.memberships, queryFn: () => backend.listMemberships() })
  const [preferred, setPreferred] = useState(preferredHousehold)
  const [inviteToken, setInviteToken] = useState(() => (backend.mode === 'supabase' ? readInviteToken() : null))
  const [status, setStatus] = useState<Bootstrap>('idle')
  // Ref, а не состояние: двойной вызов эффекта в StrictMode не должен создать два дома.
  const busy = useRef(false)
  const displayName = savedName() || firstName(user.name)
  useRealtimeRefresh()
  useProfileSync(user, memberships.data, displayName)

  const selectHousehold = useCallback((householdId: string) => {
    rememberHousehold(householdId)
    setPreferred(householdId)
  }, [])

  const hasHome = (memberships.data?.length ?? 0) > 0
  useEffect(() => {
    if (!memberships.isSuccess || busy.current) return

    async function run(step: 'joining' | 'creating', action: () => Promise<string>) {
      busy.current = true
      setStatus(step)
      try {
        selectHousehold(await action())
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

    if (inviteToken) void run('joining', () => backend.joinHousehold(inviteToken, displayName))
    else if (!hasHome && status === 'idle') void run('creating', () => backend.createHousehold(translate('home.defaultName'), displayName))
  }, [memberships.isSuccess, hasHome, inviteToken, status, displayName, selectHousehold])

  const session = useMemo<Session | null>(() => {
    const list = memberships.data
    if (!list?.length) return null
    const current = list.find((m) => m.household.id === preferred) ?? list[0]
    return { user, household: current.household, role: current.role, selectHousehold }
  }, [memberships.data, preferred, user, selectHousehold])

  if (memberships.isPending) return <p className="status">{t('common.loading')}</p>
  if (memberships.isError) return <p className="status">{t('load.reloadError')}</p>
  if (status === 'join-failed' || status === 'create-failed') {
    const joining = status === 'join-failed'
    return (
      <div className="notice">
        <h2>{t(joining ? 'join.failedTitle' : 'create.failedTitle')}</h2>
        <p>
          {t(joining ? 'join.failedText' : 'common.checkConnection')}
        </p>
        <button className="btn" type="button" onClick={() => setStatus('idle')}>
          {t(joining ? 'common.continue' : 'common.retry')}
        </button>
      </div>
    )
  }
  if (inviteToken || status === 'joining') return <p className="status">{t('join.working')}</p>
  if (!session) return <p className="status">{t('home.preparing')}</p>
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
