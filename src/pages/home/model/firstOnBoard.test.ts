import { describe, expect, it } from 'vitest'
import type { Product, Section } from '@/shared/api'
import { firstOnBoard } from './firstOnBoard'

const section = (id: string, sort_order: number): Section => ({
  id,
  household_id: 'h',
  name: id,
  icon: null,
  sort_order,
  created_at: '2026-11-01T00:00:00Z',
})

const product = (id: string, section_id: string, patch: Partial<Product> = {}): Product => ({
  id,
  household_id: 'h',
  section_id,
  name: id,
  icon: null,
  kind: 'staple',
  is_available: true,
  to_buy: false,
  created_by: null,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  ...patch,
})

const sections = [section('fridge', 0), section('cupboard', 1)]

describe('первый продукт на доске', () => {
  it('первый продукт первого раздела, а не самый новый', () => {
    const products = [
      product('old-milk', 'fridge', { created_at: '2026-11-01T00:00:00Z' }),
      product('new-rice', 'cupboard', { created_at: '2026-11-20T00:00:00Z' }),
    ]
    expect(firstOnBoard(sections, products, [])?.id).toBe('old-milk')
  })

  it('свёрнутый раздел пропускается: его продукта не видно', () => {
    const products = [product('milk', 'fridge'), product('rice', 'cupboard')]
    expect(firstOnBoard(sections, products, ['fridge'])?.id).toBe('rice')
  })

  it('с условием — первый подходящий, даже если он во втором разделе', () => {
    const products = [product('milk', 'fridge', { to_buy: true }), product('rice', 'cupboard')]
    expect(firstOnBoard(sections, products, [], (item) => !item.to_buy)?.id).toBe('rice')
  })

  it('подходящего нет — ничего', () => {
    expect(firstOnBoard(sections, [product('milk', 'fridge')], ['fridge'])).toBeUndefined()
  })
})
