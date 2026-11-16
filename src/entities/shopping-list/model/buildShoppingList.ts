import type { HomeData, Product, Section, ShoppingItem } from '@/shared/api'
import { compareTimes } from '@/shared/lib/compareTimes'

interface ShoppingEntryBase {
  /** Идентификатор продукта или ручной позиции. */
  id: string
  key: string
  addedAt: string
  /** Место, если список покупок переставляли вручную. */
  place: number | null
}

export type ShoppingEntry =
  | (ShoppingEntryBase & { type: 'product'; product: Product; section: Section | null })
  | (ShoppingEntryBase & { type: 'manual'; item: ShoppingItem })

/**
 * Список покупок — это продукты дома с отметкой `to_buy` плюс позиции, добавленные
 * вручную. Продукт не копируется в список, поэтому не может попасть в него дважды,
 * а удаление продукта или раздела убирает его и из покупок.
 *
 * Порядок: то, что переставляли вручную, — по своим местам; остальное — следом,
 * в порядке добавления в список.
 */
export function buildShoppingList(data: HomeData): ShoppingEntry[] {
  const sectionById = new Map(data.sections.map((s) => [s.id, s]))
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
    }))
  const manual: ShoppingEntry[] = data.shoppingItems.map((item) => ({
    type: 'manual',
    id: item.id,
    key: `item:${item.id}`,
    addedAt: item.created_at,
    place: item.sort_order ?? null,
    item,
  }))
  return [...fromHome, ...manual].sort(
    (a, b) => (a.place ?? Infinity) - (b.place ?? Infinity) || compareTimes(a.addedAt, b.addedAt),
  )
}

/** Название строки списка — продукта или ручной позиции. */
export const shoppingEntryName = (entry: ShoppingEntry): string =>
  entry.type === 'product' ? entry.product.name : entry.item.name
