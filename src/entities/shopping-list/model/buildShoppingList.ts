import type { HomeData, Product, Section, ShoppingItem } from '@/shared/api'
import { compareTimes } from '@/shared/lib/compareTimes'
import { normalizeName, sameName } from '@/shared/lib/sameName'

interface ShoppingEntryBase {
  /** Идентификатор продукта или ручной позиции. */
  id: string
  key: string
  addedAt: string
  /** Место, если список покупок переставляли вручную. */
  place: number | null
}

export type ShoppingEntry =
  | (ShoppingEntryBase & {
      type: 'product'
      product: Product
      section: Section | null
      /**
       * Ручные позиции с тем же названием. Новые так не появляются (продукт дома их
       * заменяет), но могли остаться от прежних версий — уходят вместе с покупкой продукта.
       */
      manualTwins: ShoppingItem[]
    })
  | (ShoppingEntryBase & {
      type: 'manual'
      item: ShoppingItem
      /** Продукт дома с тем же названием: покупка отмечает его, а не заводит второй. */
      homeProduct: Product | undefined
    })

/** Общий пустой список: у строк без двойников он не меняется между сборками, и memo-строки не перерисовываются. */
const NO_TWINS: ShoppingItem[] = []

/**
 * Список покупок — это продукты дома с отметкой `to_buy` плюс позиции, добавленные
 * вручную. Продукт не копируется в список, поэтому не может попасть в него дважды,
 * а удаление продукта или раздела убирает его и из покупок.
 *
 * Порядок: то, что переставляли вручную, — по своим местам; остальное — следом,
 * в порядке добавления в список.
 *
 * Одно название — одна вещь: у строки отмечен двойник с тем же названием с другой
 * стороны (продукт дома у ручной позиции и наоборот), чтобы покупка их сливала.
 */
export function buildShoppingList(data: HomeData): ShoppingEntry[] {
  const sectionById = new Map(data.sections.map((s) => [s.id, s]))
  const productByName = new Map<string, Product>()
  for (const product of data.products) {
    const name = normalizeName(product.name)
    if (!productByName.has(name)) productByName.set(name, product)
  }
  const itemsByName = new Map<string, ShoppingItem[]>()
  for (const item of data.shoppingItems) {
    const name = normalizeName(item.name)
    itemsByName.set(name, [...(itemsByName.get(name) ?? []), item])
  }
  const fromHome: ShoppingEntry[] = data.products
    .filter((p) => p.to_buy)
    .map((product) => ({
      type: 'product',
      id: product.id,
      key: `product:${product.id}`,
      addedAt: product.updated_at,
      place: product.shopping_order ?? null,
      product,
      section: sectionById.get(product.section_id) ?? null,
      manualTwins: itemsByName.get(normalizeName(product.name)) ?? NO_TWINS,
    }))
  const manual: ShoppingEntry[] = data.shoppingItems.map((item) => ({
    type: 'manual',
    id: item.id,
    key: `item:${item.id}`,
    addedAt: item.created_at,
    place: item.sort_order ?? null,
    item,
    homeProduct: productByName.get(normalizeName(item.name)),
  }))
  return [...fromHome, ...manual].sort(
    (a, b) => (a.place ?? Infinity) - (b.place ?? Infinity) || compareTimes(a.addedAt, b.addedAt),
  )
}

/** Название строки списка — продукта или ручной позиции. */
export const shoppingEntryName = (entry: ShoppingEntry): string =>
  entry.type === 'product' ? entry.product.name : entry.item.name

/** Строка списка с таким же названием, если она там уже есть; сама редактируемая строка не в счёт. */
export function findShoppingEntryNamed(entries: ShoppingEntry[], name: string, exceptId?: string): ShoppingEntry | undefined {
  return entries.find((entry) => entry.id !== exceptId && sameName(shoppingEntryName(entry), name))
}

/**
 * Порядок списка покупок, в котором продукт встал на место ручной позиции. Если продукт
 * уже в списке, он остаётся на своём месте, а позиция просто уходит.
 */
export function listOrderReplacing(entries: ShoppingEntry[], itemId: string, productId: string): string[] {
  const ids = entries.map((entry) => entry.id)
  if (ids.includes(productId)) return ids.filter((id) => id !== itemId)
  return ids.map((id) => (id === itemId ? productId : id))
}
