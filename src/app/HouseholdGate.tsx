import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { preferredHousehold, rememberHousehold } from '@/entities/household/lib/preferredHousehold'
import { savedName } from '@/entities/invite/lib/inviteToken'
import { membershipsQuery, prefetchHome } from '@/shared/api/homeQueries'
import type { User } from '@/shared/api/types'
import { useT } from '@/shared/i18n'
import { firstName } from '@/shared/lib/userName'
import { SessionContext, type Session } from '@/shared/session/session'
import { Notice } from '@/shared/ui/Notice'
import { Splash } from '@/shared/ui/Splash'
import { useHomeBootstrap } from './useHomeBootstrap'
import { useProfileSync } from './useProfileSync'
import { useRealtimeRefresh } from './useRealtimeRefresh'

/** Определяет текущий дом пользователя и держит данные свежими через Realtime. */
export function HouseholdGate({ user, children }: { user: User; children: ReactNode }) {
  const t = useT()
  const memberships = useQuery(membershipsQuery)
  const [preferred, setPreferred] = useState(preferredHousehold)
  const displayName = savedName() || firstName(user.name)

  const selectHousehold = useCallback((householdId: string) => {
    rememberHousehold(householdId)
    setPreferred(householdId)
  }, [])

  // Данные дома запрашиваются одновременно со списком домов, а не после него.
  useEffect(() => {
    const householdId = preferredHousehold()
    if (householdId) prefetchHome(householdId)
  }, [])

  useRealtimeRefresh()
  useProfileSync(user, memberships.data, displayName)
  const bootstrap = useHomeBootstrap({
    // Время 0 — данные из снимка прошлого запуска; решать по ним, что дома нет, нельзя.
    ready: memberships.isSuccess && memberships.dataUpdatedAt > 0,
    hasHome: (memberships.data?.length ?? 0) > 0,
    displayName,
    onHome: selectHousehold,
  })

  const session = useMemo<Session | null>(() => {
    const list = memberships.data
    if (!list?.length) return null
    const current = list.find((m) => m.household.id === preferred) ?? list[0]
    return { user, household: current.household, role: current.role, memberships: list, selectHousehold }
  }, [memberships.data, preferred, user, selectHousehold])

  if (memberships.isPending) return <Splash />
  if (memberships.isLoadingError) return <Splash>{t('load.reloadError')}</Splash>
  if (bootstrap.status === 'join-failed') {
    return (
      <Notice title={t('join.failedTitle')} actionLabel={t('common.continue')} onAction={bootstrap.reset}>
        {t('join.failedText')}
      </Notice>
    )
  }
  if (bootstrap.status === 'create-failed') {
    return (
      <Notice title={t('create.failedTitle')} actionLabel={t('common.retry')} onAction={bootstrap.reset}>
        {t('common.checkConnection')}
      </Notice>
    )
  }
  if (bootstrap.joining) return <Splash>{t('join.working')}</Splash>
  if (!session) return <Splash>{t('home.preparing')}</Splash>
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
