import { describe, expect, it } from 'vitest'
import { keyboardInset } from './keyboard'

/* Числа — с iPhone 14 Pro Max: окно 932 по высоте, над клавиатурой видно 456. */
describe('место под клавиатурой', () => {
  it('клавиатуры нет — снизу ничего не закрыто', () => {
    expect(keyboardInset({ layout: 932, height: 932, offsetTop: 0 })).toBe(0)
  })

  it('клавиатура открыта — шторка поднимается на её высоту', () => {
    expect(keyboardInset({ layout: 932, height: 456, offsetTop: 0 })).toBe(476)
  })

  it('видимая часть сдвинута — поднимаемся только на остаток', () => {
    expect(keyboardInset({ layout: 932, height: 456, offsetTop: 410 })).toBe(66)
  })

  it('ниже края не уходим', () => {
    expect(keyboardInset({ layout: 932, height: 456, offsetTop: 500 })).toBe(0)
  })
})
