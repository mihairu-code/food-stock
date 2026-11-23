import { expect, it } from 'vitest'
import { PURCHASED, stockState, withAvailability, withToBuy } from './stockRules'

it('состояние точки выводится из двух отметок', () => {
  expect(stockState({ is_available: true, to_buy: false })).toBe('in')
  expect(stockState({ is_available: true, to_buy: true })).toBe('low')
  expect(stockState({ is_available: false, to_buy: true })).toBe('out')
  expect(stockState({ is_available: false, to_buy: false })).toBe('out')
})

it('купленный продукт без точки', () => {
  expect(stockState(PURCHASED)).toBe('in')
})

it('закончившийся продукт сам попадает в покупки, вернувшийся домой — уходит из них', () => {
  expect(withAvailability(false)).toEqual({ is_available: false, to_buy: true })
  expect(withAvailability(true)).toEqual({ is_available: true, to_buy: false })
})

it('минус у закончившегося оставляет его закончившимся, но не в покупках', () => {
  expect(withToBuy(withAvailability(false), false)).toEqual({ is_available: false, to_buy: false })
})
