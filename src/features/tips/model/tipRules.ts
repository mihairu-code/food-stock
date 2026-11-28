import { stockState } from '@/entities/product'
import type { Product, Section } from '@/shared/api'

const DAY_MS = 24 * 60 * 60 * 1000

/** Советы — про привычки, поэтому начинаются не раньше третьего дня: сначала обучение. */
export const TIPS_FROM_DAY = 3
/** Совет 1 — пока удаление свежее: через пару дней повод уже никто не вспомнит. */
export const ONE_OFF_FRESH_DAYS = 2
/** Совет 2: закончилось, не в покупках и не менялось столько дней. */
export const STALE_DAYS = 21
/** Совет 5: строк в покупках — с этого числа порядок магазина уже заметен. */
export const SHOP_ORDER_AT = 8
/** Совет 6: в разделе столько продуктов — искать глазами уже трудно (как и с лупой). */
export const CROWDED_AT = 20
/** Совет 7: столько продуктов — минималистичный вид помещает на экран заметно больше. */
export const MINIMAL_AT = 40
/** Совет 8: столько раз отметили «закончилось» прямо в магазине. */
export const QUICK_BUYS_FOR_TIP = 3
/** Совет 3+4 без iPhone: дом уже ценен — столько дней или столько продуктов. */
export const ACCOUNT_DAYS = 7
export const ACCOUNT_PRODUCTS = 15
/** Совет 3+4 на iPhone в Safari — с этого захода: человек вернулся и, похоже, остаётся. */
export const ACCOUNT_OPENS = 3

/** Совет 1: продукт, добавленный меньше недели назад, удалили недавно. */
export const oneOffDue = (deletedAt: number, now: number): boolean =>
  deletedAt > 0 && now - deletedAt < ONE_OFF_FRESH_DAYS * DAY_MS

/**
 * Совет 2: продукт, который давно закончился и больше не нужен, — закончился, не в покупках
 * и не менялся STALE_DAYS дней. Из нескольких — самый давний.
 */
export function staleProduct(products: readonly Product[], now: number): Product | undefined {
  const stale = products.filter(
    (product) =>
      stockState(product) === 'out' && !product.to_buy && now - Date.parse(product.updated_at) >= STALE_DAYS * DAY_MS,
  )
  return stale.sort((a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at))[0]
}

/** Сколько полных недель прошло — для текста совета 2. */
export const weeksSince = (date: string, now: number): number => Math.floor((now - Date.parse(date)) / (7 * DAY_MS))

/** Совет 6: самый тесный раздел, если в нём CROWDED_AT продуктов и больше. */
export function crowdedSection(
  sections: readonly Section[],
  products: readonly Product[],
): { section: Section; count: number } | undefined {
  let found: { section: Section; count: number } | undefined
  for (const section of sections) {
    const count = products.filter((product) => product.section_id === section.id).length
    if (count >= CROWDED_AT && count > (found?.count ?? 0)) found = { section, count }
  }
  return found
}

interface AccountTipInput {
  anonymous: boolean
  googleAvailable: boolean
  /** iPhone или iPad в браузере: у приложения с экрана «Домой» будет своё хранилище. */
  appleBrowser: boolean
  opens: number
  days: number
  products: number
}

/** Совет 3+4 «Не потерять дом»: без аккаунта, когда дому уже есть что терять. */
export function accountTipDue({ anonymous, googleAvailable, appleBrowser, opens, days, products }: AccountTipInput): boolean {
  if (!anonymous || !googleAvailable) return false
  if (appleBrowser) return products > 0 && opens >= ACCOUNT_OPENS
  return days >= ACCOUNT_DAYS || products >= ACCOUNT_PRODUCTS
}
