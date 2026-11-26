import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { leftHouseholdSelf, preferredHousehold, rememberHousehold } from '@/entities/household'
import { membershipsQuery, prefetchHome, type User } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { firstName, savedName } from '@/shared/lib/userName'
import { SessionContext, type Session } from '@/shared/session'
import { Notice, StatusNote } from '@/shared/ui'
import { removedHome, type ShownHome } from './removedHome'
import { useHomeBootstrap } from './useHomeBootstrap'
import { useProfileSync } from './useProfileSync'
import { useVisitMark } from './useVisitMark'
import { useRealtimeSync } from './useRealtimeSync'

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

  // Открытый дом с названием: когда он пропадёт из списка, назвать его будет уже не по чему.
  // При запуске это дом из снимка прошлого запуска, поэтому удаление, случившееся, пока
  // приложение было закрыто, тоже замечается.
  const shownHome = useRef<ShownHome | null>(null)
  useEffect(() => {
    const list = memberships.data
    if (!list) return
    if (memberships.dataUpdatedAt > 0) {
      const removed = removedHome(shownHome.current, list, leftHouseholdSelf)
      // Дальше, как и раньше, — первый из оставшихся домов (session ниже), а если домов
      // нет, новый пустой создаст useHomeBootstrap.
      if (removed) notify('toast.removedFromHome', { name: removed.name })
    }
    // Открыт выбранный на устройстве дом, а если его нет — первый из списка. Первый из
    // снимка прошлого запуска не в счёт: его человек мог и не видеть (например, после
    // слияния аккаунтов), а «Вас удалили» о нём было бы неправдой.
    const shown =
      list.find((membership) => membership.household.id === preferred)?.household ??
      (memberships.dataUpdatedAt > 0 ? list[0]?.household : undefined)
    shownHome.current = shown ? { id: shown.id, name: shown.name } : null
  }, [memberships.data, memberships.dataUpdatedAt, preferred])

  useRealtimeSync()
  useProfileSync(user, memberships.data, displayName)
  useVisitMark(user.id)
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

  if (memberships.isPending) return <StatusNote fullscreen loading />
  if (memberships.isLoadingError) return <StatusNote fullscreen>{t('load.reloadError')}</StatusNote>
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
  if (bootstrap.joining) return <StatusNote fullscreen loading>{t('join.working')}</StatusNote>
  if (!session) return <StatusNote fullscreen loading>{t('home.preparing')}</StatusNote>
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
