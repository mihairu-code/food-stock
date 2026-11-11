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

describe('подбор иконки на других языках', () => {
  const en = (name: string) => suggestEmojis(name, { lang: 'en' })
  const ja = (name: string) => suggestEmojis(name, { lang: 'ja' })
  const vi = (name: string) => suggestEmojis(name, { lang: 'vi' })

  it('английский: слово, множественное число и словосочетания', () => {
    expect(en('Milk').best).toBe('🥛')
    expect(en('eggs').best).toBe('🥚')
    expect(en('Strawberries').best).toBe('🍓')
    expect(en('tomatoes').best).toBe('🍅')
    expect(en('ice cream').best).toBe('🍦')
    expect(en('Toilet paper').best).toBe('🧻')
    expect(en('olive oil').best).toBe('🫒')
    expect(en('Greek yogurt').options[0]).toBe('🥣')
  })

  it('английский: короткое слово не цепляет чужие длинные', () => {
    expect(en('eggplant').best).toBe('🍆')
    expect(en('cheesecake').best).toBe('🍰')
    expect(en('watermelon').best).toBe('🍉')
    expect(en('hamburger').best).toBe('🍔')
    expect(en('teaspoon').options).not.toContain('🍵')
    // «bunch» — не булочка (bun): уверенного совпадения нет, первой идёт иконка бананов.
    expect(en('bunch of bananas').best).toBeNull()
    expect(en('bunch of bananas').options[0]).toBe('🍌')
  })

  it('английский: без точной иконки показывает соседей по группе', () => {
    expect(en('snacks').options.slice(0, 3)).toEqual(['🥨', '🍟', '🥜'])
    expect(en('vegetables').best).toBeNull()
    expect(en('vegetables').options.slice(0, 2)).toEqual(['🥔', '🥕'])
    expect(en('mi').options).toEqual(expect.arrayContaining(['🥛']))
  })

  it('японский: слово находится внутри названия, катакана и хирагана равнозначны', () => {
    expect(ja('牛乳').best).toBe('🥛')
    expect(ja('バナナ').best).toBe('🍌')
    expect(ja('ばなな').best).toBe('🍌')
    expect(ja('北海道牛乳 1L').options[0]).toBe('🥛')
    expect(ja('トイレットペーパー').best).toBe('🧻')
    expect(ja('すいか').best).toBe('🍉')
    expect(ja('たまご').best).toBe('🥚')
  })

  it('японский: длинное слово важнее короткого, входящего в него', () => {
    expect(ja('パンケーキ').best).toBe('🥞')
    expect(ja('食パン').best).toBe('🍞')
    expect(ja('ツナ缶').best).toBe('🥫')
    expect(ja('豆乳').best).toBe('🥛')
    expect(ja('果物').best).toBeNull()
    expect(ja('果物').options.slice(0, 2)).toEqual(['🍎', '🍌'])
  })

  it('вьетнамский: совпадает слово или словосочетание целиком', () => {
    expect(vi('Sữa').best).toBe('🥛')
    expect(vi('sữa chua').best).toBe('🥣')
    expect(vi('Bánh mì').best).toBe('🍞')
    expect(vi('nước mắm').best).toBe('🥫')
    expect(vi('Cà phê sữa').best).toBe('☕')
    expect(vi('trứng gà').best).toBe('🥚')
    expect(vi('giấy vệ sinh').best).toBe('🧻')
  })

  it('вьетнамский без диакритики находится, но сам не подставляется', () => {
    expect(vi('sua chua').options[0]).toBe('🥣')
    expect(vi('sua chua').best).toBeNull()
    expect(vi('banh mi').options[0]).toBe('🍞')
  })

  it('языки не мешают друг другу', () => {
    // «pin» — батарейка только во вьетнамском интерфейсе.
    expect(vi('pin').best).toBe('🔋')
    expect(en('pin').options).not.toContain('🔋')
    expect(en('hat').options).not.toContain('🥜')
    // Слово с диакритикой однозначно вьетнамское — работает при любом языке интерфейса.
    expect(en('sữa').best).toBe('🥛')
    // Название на другом языке, чем интерфейс, всё равно находится.
    expect(ja('молоко').best).toBe('🥛')
    expect(vi('bread').best).toBe('🍞')
    expect(suggestEmojis('牛乳').best).toBe('🥛')
  })
})
