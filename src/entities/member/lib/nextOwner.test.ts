import { expect, it } from 'vitest'
import type { Member } from '@/shared/api'
import { nextOwner } from './nextOwner'

const member = (user_id: string, role: Member['role'], created_at: string): Member => ({
  household_id: 'h1',
  user_id,
  role,
  display_name: '',
  device: '',
  account_email: null,
  created_at,
})

const owner = member('owner', 'owner', '2026-01-01T00:00:00Z')
const early = member('b-early', 'member', '2026-02-01T00:00:00Z')
const late = member('a-late', 'member', '2026-03-01T00:00:00Z')

it('уходит владелец — владельцем станет тот, кто в доме дольше всех', () => {
  expect(nextOwner([owner, late, early], 'owner')).toBe(early)
})

it('вступили одновременно — решает идентификатор, как в базе', () => {
  const twin = member('a-twin', 'member', early.created_at)
  expect(nextOwner([owner, early, twin], 'owner')).toBe(twin)
})

it('уходит не владелец — владелец прежний', () => {
  expect(nextOwner([owner, early], 'b-early')).toBeNull()
})
