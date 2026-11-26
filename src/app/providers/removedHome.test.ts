import { expect, it } from 'vitest'
import type { Membership } from '@/shared/api'
import { removedHome } from './removedHome'

const home = (id: string, name: string): Membership => ({
  household: { id, name, created_at: '2026-01-01T00:00:00Z' },
  role: 'member',
})

const shown = { id: 'h1', name: 'Дача' }
const nobodyLeft = () => false

it('дом пропал из списка — участника удалили', () => {
  expect(removedHome(shown, [home('h2', 'Квартира')], nobodyLeft)).toBe(shown)
  expect(removedHome(shown, [], nobodyLeft)).toBe(shown)
})

it('дом на месте или открытого дома ещё не было — сказать нечего', () => {
  expect(removedHome(shown, [home('h1', 'Дача')], nobodyLeft)).toBeNull()
  expect(removedHome(null, [], nobodyLeft)).toBeNull()
})

it('свой выход — не удаление', () => {
  expect(removedHome(shown, [], (id) => id === 'h1')).toBeNull()
})
