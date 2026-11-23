/**
 * Поиск по названию: что считается совпадением и как найденное упорядочено.
 *
 * Сравниваются названия, приведённые к одному виду: нижний регистр, `ё` = `е`, пробелы
 * подряд — один. У латиницы снимается диакритика: `pho` находит `phở`, `đ` = `d`.
 * Кириллицу (кроме `ё`) и японский не трогаем: разложение превратило бы `й` в `и`,
 * а `が` в `か` — это другие буквы, а не та же с пометкой.
 */

/** Совпадение в исходном названии: подсвечивается [start, end). */
export interface NameMatch {
  start: number
  end: number
}

interface Normalized {
  text: string
  /** Для каждого символа text — где в исходной строке начинается и кончается его источник. */
  from: number[]
  to: number[]
}

const LATIN = /\p{Script=Latin}/u
const MARK = /\p{M}/u
const WORD = /[\p{L}\p{N}]/u
const SPACE = /\s/u

function normalize(source: string): Normalized {
  const text: string[] = []
  const from: number[] = []
  const to: number[] = []
  let afterLatin = false
  let index = 0
  for (const char of source) {
    const start = index
    index += char.length
    if (SPACE.test(char)) {
      afterLatin = false
      if (text.length > 0 && text[text.length - 1] === ' ') continue
      text.push(' ')
      from.push(start)
      to.push(index)
      continue
    }
    // Название могли сохранить разложенным: буква и отдельно её знак. Знак после
    // латинской буквы — та же диакритика, его не сравниваем.
    if (MARK.test(char) && afterLatin) {
      to[to.length - 1] = index
      continue
    }
    afterLatin = LATIN.test(char)
    let lower = char.toLowerCase()
    if (lower === 'ё') lower = 'е'
    else if (lower === 'đ') lower = 'd'
    else if (afterLatin) lower = lower.normalize('NFD').replace(/\p{M}/gu, '')
    for (const part of lower) {
      text.push(part)
      from.push(start)
      to.push(index)
    }
  }
  return { text: text.join(''), from, to }
}

/** Запрос в том виде, в каком его сравнивают; пустая строка — искать нечего. */
export const normalizeQuery = (query: string): string => normalize(query).text.trim()

/** Где совпадение: 0 — с начала названия, 1 — с начала слова, 2 — в середине. */
type MatchRank = 0 | 1 | 2

function findInName(name: string, query: string): { match: NameMatch; rank: MatchRank } | null {
  const normalized = normalize(name)
  let position = normalized.text.indexOf(query)
  if (position === -1) return null
  // Совпадение с начала слова важнее, даже если в середине слова оно встретилось раньше:
  // в «Пересыр сырный» подсвечивается «сыр» второго слова.
  let rank: MatchRank = 2
  for (let at = position; at !== -1; at = normalized.text.indexOf(query, at + 1)) {
    const atRank: MatchRank = at === 0 ? 0 : WORD.test(normalized.text[at - 1]) ? 2 : 1
    if (atRank < rank) {
      rank = atRank
      position = at
    }
    if (rank < 2) break
  }
  return {
    match: { start: normalized.from[position], end: normalized.to[position + query.length - 1] },
    rank,
  }
}

/**
 * Продукты, в названии которых есть запрос (`query` — уже из normalizeQuery), с местом
 * совпадения. Сначала совпадение с начала названия, затем с начала слова, затем в середине;
 * при равенстве — порядок, в котором продукты пришли (ручной порядок раздела).
 */
export function matchProductsByName<T extends { name: string }>(
  products: readonly T[],
  query: string,
): { product: T; match: NameMatch }[] {
  return products
    .flatMap((product) => {
      const found = findInName(product.name, query)
      return found ? [{ product, ...found }] : []
    })
    // sort устойчивая: при равном месте сохраняется ручной порядок.
    .sort((a, b) => a.rank - b.rank)
    .map(({ product, match }) => ({ product, match }))
}
