import { useQuery } from '@tanstack/react-query'
import { useHouseholdId } from '@/app/session'
import { backend } from '@/data'
import type { HouseholdPatch } from '@/data/backend'
import { savedName } from '@/lib/invite'
import { qk } from './keys'
import { invitesQuery, membersQuery } from './queries'
import { useAction } from './useAction'

export function useMembers() {
  return useQuery(membersQuery(useHouseholdId()))
}

export function useInvites() {
  return useQuery(invitesQuery(useHouseholdId()))
}

/** Создаёт одноразовую ссылку; результат мутации — её токен. */
export function useCreateInvite() {
  const hid = useHouseholdId()
  return useAction(() => backend.createInvite(hid), { failed: 'toast.linkError', refresh: qk.invites(hid) })
}

export function useRevokeInvite() {
  const hid = useHouseholdId()
  return useAction((inviteId: string) => backend.deleteInvite(inviteId), {
    done: 'toast.linkRevoked',
    refresh: qk.invites(hid),
  })
}

export function useRemoveMember() {
  const hid = useHouseholdId()
  return useAction((userId: string) => backend.removeMember(hid, userId), {
    done: 'toast.memberRemoved',
    refresh: qk.members(hid),
  })
}

/** Вступление по ссылке; результат — идентификатор дома. Ошибку показывает сама форма. */
export function useJoinHousehold() {
  return useAction((token: string) => backend.joinHousehold(token, savedName()), {
    failed: null,
    refresh: 'all',
  })
}

export function useSetDisplayName() {
  const hid = useHouseholdId()
  return useAction((name: string) => backend.setDisplayName(hid, name), {
    failed: 'toast.nameError',
    refresh: qk.members(hid),
  })
}

/** Название и аватарка дома. */
export function useUpdateHousehold() {
  const hid = useHouseholdId()
  return useAction((patch: HouseholdPatch) => backend.updateHousehold(hid, patch), {
    failed: 'toast.renameError',
    refresh: qk.memberships,
  })
}
