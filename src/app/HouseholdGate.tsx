import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import { queryClient } from '@/data/queryClient'
import type { User } from '@/domain/types'
import { preferredHousehold, rememberHousehold } from '@/lib/household'
import { clearInviteToken, readInviteToken, savedName } from '@/lib/invite'
import { SessionContext, type Session } from './session'
import { useRealtimeRefresh } from './useRealtimeRefresh'

type Bootstrap = 'idle' | 'joining' | 'creating' | 'join-failed' | 'create-failed'

/**
 * Находит дом пользователя. При запуске по ссылке-приглашению вступает в чужой дом;
 * если домов нет вовсе — создаёт первый.
 */
export function HouseholdGate({ user, children }: { user: User; children: ReactNode }) {
  const memberships = useQuery({ queryKey: qk.memberships, queryFn: () => backend.listMemberships() })
  const [preferred, setPreferred] = useState(preferredHousehold)
  const [inviteToken, setInviteToken] = useState(() => (backend.mode === 'supabase' ? readInviteToken() : null))
  const [status, setStatus] = useState<Bootstrap>('idle')
  // Ref, а не состояние: двойной вызов эффекта в StrictMode не должен создать два дома.
  const busy = useRef(false)
  useRealtimeRefresh()

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

    if (inviteToken) void run('joining', () => backend.joinHousehold(inviteToken, savedName()))
    else if (!hasHome && status === 'idle') void run('creating', () => backend.createHousehold('Наш дом', savedName()))
  }, [memberships.isSuccess, hasHome, inviteToken, status, selectHousehold])

  const session = useMemo<Session | null>(() => {
    const list = memberships.data
    if (!list?.length) return null
    const current = list.find((m) => m.household.id === preferred) ?? list[0]
    return { user, household: current.household, role: current.role, selectHousehold }
  }, [memberships.data, preferred, user, selectHousehold])

  if (memberships.isPending) return <p className="status">Загрузка…</p>
  if (memberships.isError) return <p className="status">Не удалось загрузить дом. Обновите страницу.</p>
  if (status === 'join-failed' || status === 'create-failed') {
    const joining = status === 'join-failed'
    return (
      <div className="notice">
        <h2>{joining ? 'Не получилось вступить в дом' : 'Не удалось создать дом'}</h2>
        <p>
          {joining
            ? 'Ссылка недействительна, истекла или уже использована. Попросите новую.'
            : 'Проверьте соединение и попробуйте ещё раз.'}
        </p>
        <button className="btn" type="button" onClick={() => setStatus('idle')}>
          {joining ? 'Продолжить' : 'Повторить'}
        </button>
      </div>
    )
  }
  if (inviteToken || status === 'joining') return <p className="status">Вступаем в дом…</p>
  if (!session) return <p className="status">Готовим ваш дом…</p>
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
