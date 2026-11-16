import { useQuery } from '@tanstack/react-query'
import { backend, invitesQuery, qk, useAction } from '@/shared/api'
import { savedName } from '@/shared/lib/userName'
import { useHouseholdId } from '@/shared/session'

export function useInvites() {
  return useQuery(invitesQuery(useHouseholdId()))
}

/** Создаёт одноразовую ссылку; результат мутации — её токен. */
export function useCreateInvite() {
  const householdId = useHouseholdId()
  return useAction(() => backend.createInvite(householdId), {
    failed: 'toast.linkError',
    refresh: qk.invites(householdId),
  })
}

export function useRevokeInvite() {
  const householdId = useHouseholdId()
  return useAction((inviteId: string) => backend.deleteInvite(inviteId), {
    done: 'toast.linkRevoked',
    refresh: qk.invites(householdId),
  })
}

/** Вступление по ссылке; результат — идентификатор дома. Ошибку показывает сама форма. */
export function useJoinHousehold() {
  return useAction((token: string) => backend.joinHousehold(token, savedName()), {
    failed: null,
    refresh: 'all',
  })
}
