import type { Member } from '@/shared/api'

/**
 * Кто станет владельцем, если уйдёт этот участник: тот, кто в доме дольше всех, — по тому
 * же правилу, что private.leave_home в базе. null — уходит не владелец или больше некому.
 */
export function nextOwner(members: readonly Member[], leavingUserId: string): Member | null {
  const leaving = members.find((member) => member.user_id === leavingUserId)
  if (leaving?.role !== 'owner') return null
  const rest = members.filter((member) => member.user_id !== leavingUserId)
  rest.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || (a.user_id < b.user_id ? -1 : 1))
  return rest[0] ?? null
}
