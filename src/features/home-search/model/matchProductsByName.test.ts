import { describe, expect, it } from 'vitest'
import { matchProductsByName, normalizeQuery } from './matchProductsByName'

const products = (...names: string[]) => names.map((name) => ({ name }))
const find = (names: string[], query: string) =>
  matchProductsByName(products(...names), normalizeQuery(query)).map(({ product }) => product.name)
/** Подсвеченная часть названия. */
const marked = (name: string, query: string) => {
  const [found] = matchProductsByName(products(name), normalizeQuery(query))
  return found && name.slice(found.match.start, found.match.end)
}

describe('запрос', () => {
  it('регистр, пробелы по краям и подряд не важны', () => {
    expect(normalizeQuery('  Зелёный   ЧАЙ ')).toBe('зеленый чай')
  })

  it('одни пробелы — искать нечего', () => {
    expect(normalizeQuery('   ')).toBe('')
  })
})

describe('что находится', () => {
  it('подстрока в любом месте названия', () => {
    expect(find(['Молоко', 'Сыр', 'Кокосовое молоко'], 'моло')).toEqual(['Молоко', 'Кокосовое молоко'])
  })

  it('ё и е — одна буква, в обе стороны', () => {
    expect(find(['Зелёный чай', 'Ежевика'], 'зеленый')).toEqual(['Зелёный чай'])
    expect(find(['Ежевика', 'Ёрш'], 'ёж')).toEqual(['Ежевика'])
  })

  it('й не становится и: это другая буква', () => {
    expect(find(['Чай', 'Чаинки'], 'чай')).toEqual(['Чай'])
    expect(find(['Чай'], 'чаи')).toEqual([])
  })

  it('у латиницы диакритика снимается: pho находит phở, đ = d', () => {
    expect(find(['Phở bò', 'Bánh mì', 'Đậu phụ'], 'pho')).toEqual(['Phở bò'])
    expect(find(['Đậu phụ'], 'dau')).toEqual(['Đậu phụ'])
    expect(find(['Crème fraîche'], 'creme')).toEqual(['Crème fraîche'])
  })

  it('с диакритикой в запросе тоже находит', () => {
    expect(find(['Pho bo'], 'phở')).toEqual(['Pho bo'])
  })

  it('название, сохранённое разложенным (буква и знак отдельно), находится так же', () => {
    expect(find(['Phở'.normalize('NFD')], 'pho')).toHaveLength(1)
  })

  it('японские が и か — разные', () => {
    expect(find(['たまご', 'がっこう'], 'か')).toEqual([])
    expect(find(['にんじん', 'たまご'], 'たま')).toEqual(['たまご'])
  })
})

describe('порядок найденного', () => {
  it('сначала с начала названия, затем с начала слова, затем в середине', () => {
    expect(find(['Творожный сырок', 'Козий сыр', 'Сыр', 'Пересыр'], 'сыр')).toEqual([
      'Сыр',
      'Творожный сырок',
      'Козий сыр',
      'Пересыр',
    ])
  })

  it('при равенстве — ручной порядок раздела', () => {
    expect(find(['Молоко овсяное', 'Морковь', 'Мороженое'], 'мо')).toEqual([
      'Молоко овсяное',
      'Морковь',
      'Мороженое',
    ])
  })

  it('совпадение с начала слова важнее, чем раньше в середине слова', () => {
    // «сыр» встречается в «Пересыр» раньше, но второе слово начинается с него.
    expect(marked('Пересыр сырный', 'сыр')).toBe('сыр')
    const [found] = matchProductsByName(products('Пересыр сырный'), 'сыр')
    expect(found.match.start).toBe(8)
  })
})

describe('подсветка', () => {
  it('выделяет то, что ввели, в исходном написании', () => {
    expect(marked('Зелёный чай', 'зеленый')).toBe('Зелёный')
    expect(marked('Phở bò', 'pho')).toBe('Phở')
  })

  it('пробелы подряд в названии не сбивают границы', () => {
    expect(marked('Рис   басмати', 'рис басм')).toBe('Рис   басм')
  })

  it('разложенная буква подсвечивается вместе со своим знаком', () => {
    const name = 'Phở'.normalize('NFD')
    expect(marked(name, 'pho')).toBe(name)
  })
})
