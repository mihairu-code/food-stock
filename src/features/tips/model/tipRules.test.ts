import { describe, expect, it } from 'vitest'
import type { Product, Section } from '@/shared/api'
import { accountTipDue, crowdedSection, oneOffDue, staleProduct, weeksSince } from './tipRules'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-12-01T12:00:00Z')
const daysAgo = (days: number) => new Date(NOW - days * DAY).toISOString()

const product = (patch: Partial<Product>): Product => ({
  id: 'p',
  household_id: 'h',
  section_id: 's',
  name: 'Кетчуп',
  icon: null,
  kind: 'staple',
  is_available: true,
  to_buy: false,
  created_by: null,
  created_at: daysAgo(60),
  updated_at: daysAgo(30),
  ...patch,
})

const section = (id: string, name: string): Section => ({
  id,
  household_id: 'h',
  name,
  icon: null,
  sort_order: 0,
  created_at: daysAgo(60),
})

describe('совет 1: разовое — в покупки', () => {
  it('удалили недавно — пора', () => {
    expect(oneOffDue(NOW - DAY, NOW)).toBe(true)
  })

  it('не удаляли или удалили давно — нет', () => {
    expect(oneOffDue(0, NOW)).toBe(false)
    expect(oneOffDue(NOW - 3 * DAY, NOW)).toBe(false)
  })
})

describe('совет 2: давно закончилось', () => {
  it('закончилось, не в покупках, три недели без изменений — самое давнее', () => {
    const list = [
      product({ id: 'a', is_available: false, updated_at: daysAgo(22) }),
      product({ id: 'b', is_available: false, updated_at: daysAgo(40) }),
    ]
    expect(staleProduct(list, NOW)?.id).toBe('b')
  })

  it('в покупках, есть дома или менялось недавно — не повод', () => {
    expect(
      staleProduct(
        [
          product({ id: 'listed', is_available: false, to_buy: true, updated_at: daysAgo(40) }),
          product({ id: 'home', is_available: true, updated_at: daysAgo(40) }),
          product({ id: 'recent', is_available: false, updated_at: daysAgo(5) }),
        ],
        NOW,
      ),
    ).toBeUndefined()
  })

  it('недели считаются полными', () => {
    expect(weeksSince(daysAgo(22), NOW)).toBe(3)
  })
})

describe('совет 6: тесный раздел', () => {
  it('самый тесный раздел с двадцатью продуктами и больше', () => {
    const sections = [section('fridge', 'Холодильник'), section('cupboard', 'Шкаф')]
    const products = [
      ...Array.from({ length: 21 }, (_, i) => product({ id: `f${i}`, section_id: 'fridge' })),
      ...Array.from({ length: 24 }, (_, i) => product({ id: `c${i}`, section_id: 'cupboard' })),
    ]
    expect(crowdedSection(sections, products)).toEqual({ section: sections[1], count: 24 })
  })

  it('меньше двадцати — не повод', () => {
    const products = Array.from({ length: 19 }, (_, i) => product({ id: `f${i}`, section_id: 'fridge' }))
    expect(crowdedSection([section('fridge', 'Холодильник')], products)).toBeUndefined()
  })
})

describe('совет 3+4: не потерять дом', () => {
  const base = { anonymous: true, googleAvailable: true, appleBrowser: false, opens: 1, days: 1, products: 3 }

  it('с аккаунтом или без входа через Google — не нужен', () => {
    expect(accountTipDue({ ...base, anonymous: false, days: 30 })).toBe(false)
    expect(accountTipDue({ ...base, googleAvailable: false, days: 30 })).toBe(false)
  })

  it('на iPhone в Safari — с третьего захода, если есть продукты', () => {
    expect(accountTipDue({ ...base, appleBrowser: true, opens: 2 })).toBe(false)
    expect(accountTipDue({ ...base, appleBrowser: true, opens: 3 })).toBe(true)
    expect(accountTipDue({ ...base, appleBrowser: true, opens: 3, products: 0 })).toBe(false)
  })

  it('в остальных случаях — через неделю или с пятнадцати продуктов', () => {
    expect(accountTipDue(base)).toBe(false)
    expect(accountTipDue({ ...base, days: 7 })).toBe(true)
    expect(accountTipDue({ ...base, products: 15 })).toBe(true)
  })
})
