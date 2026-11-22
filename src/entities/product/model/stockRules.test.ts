import { expect, it } from 'vitest'
import { PURCHASED, stockState } from './stockRules'

it('состояние точки выводится из двух отметок', () => {
  expect(stockState({ is_available: true, to_buy: false })).toBe('in')
  expect(stockState({ is_available: true, to_buy: true })).toBe('low')
  expect(stockState({ is_available: false, to_buy: true })).toBe('out')
  expect(stockState({ is_available: false, to_buy: false })).toBe('out')
})

it('купленный продукт без точки', () => {
  expect(stockState(PURCHASED)).toBe('in')
})
