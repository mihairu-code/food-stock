import { describe, expect, it } from 'vitest'
import { suggestEmojis } from './emojiSuggest'

const first = (name: string) => suggestEmojis(name).options[0]

describe('подбор иконки по названию', () => {
  it('находит точную иконку в любом падеже и регистре', () => {
    expect(first('Молоко')).toBe('🥛')
    expect(first('молока 3,2%')).toBe('🥛')
    expect(first('ХЛЕБ бородинский')).toBe('🍞')
    expect(first('яйца')).toBe('🥚')
    expect(first('Яблоки зелёные')).toBe('🍎')
    expect(first('куриное филе')).toBe('🍗')
    expect(first('Кофе в зёрнах')).toBe('☕')
    expect(first('туалетная бумага')).toBe('🧻')
  })

  it('уверенное совпадение предлагается для автоподстановки', () => {
    expect(suggestEmojis('Сыр').best).toBe('🧀')
    expect(suggestEmojis('гречка').best).toBe('🍚')
  })

  it('без точной иконки показывает соседей по группе', () => {
    const snacks = suggestEmojis('Сухарики').options
    expect(snacks[0]).toBe('🥨')
    expect(snacks).toEqual(expect.arrayContaining(['🍟', '🥜', '🍿']))

    // Слово называет группу целиком — показываем всю группу.
    expect(suggestEmojis('фрукты').options.slice(0, 4)).toEqual(['🍎', '🍌', '🍊', '🍋'])
    expect(suggestEmojis('фрукты').best).toBeNull()
  })

  it('после точной иконки идут продукты той же группы', () => {
    const dairy = suggestEmojis('кефир').options
    expect(dairy[0]).toBe('🥛')
    expect(dairy.slice(1, 4)).toEqual(['🧀', '🧈', '🥚'])
  })

  it('подсказывает уже во время набора', () => {
    expect(suggestEmojis('мо').options).toEqual(expect.arrayContaining(['🥛', '🥕', '🍦']))
    expect(suggestEmojis('мо').best).toBeNull()
  })

  it('прощает одну опечатку, но не подставляет иконку сам', () => {
    const typo = suggestEmojis('малоко')
    expect(typo.options[0]).toBe('🥛')
    expect(typo.best).toBeNull()
  })

  it('короткие основы не цепляют чужие длинные слова', () => {
    expect(first('колбаса')).toBe('🌭')
    expect(first('виноград')).toBe('🍇')
    expect(first('кола')).toBe('🥤')
    expect(first('вино')).toBe('🍷')
    expect(first('курага')).toBe('🍑')
  })

  it('первое слово названия важнее уточнения', () => {
    expect(first('масло оливковое')).toBe('🧈')
    expect(suggestEmojis('масло оливковое').options).toContain('🫒')
  })

  it('пустое или незнакомое название даёт набор по умолчанию', () => {
    const defaults = suggestEmojis('').options
    expect(defaults).toHaveLength(11)
    expect(suggestEmojis('   ').options).toEqual(defaults)
    expect(suggestEmojis('ъъъ').options).toEqual(defaults)
    expect(suggestEmojis('ъъъ').best).toBeNull()
  })

  it('не возвращает повторов и держит лимит', () => {
    for (const name of ['молоко', 'сухарики', 'масло оливковое', 'мо', '']) {
      const { options } = suggestEmojis(name)
      expect(new Set(options).size).toBe(options.length)
      expect(options.length).toBeLessThanOrEqual(11)
    }
  })

  it('числа в начале названия не мешают', () => {
    expect(suggestEmojis('2 молока').best).toBe('🥛')
  })
})

