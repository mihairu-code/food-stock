import type { Product, ProductKind, Section, ShoppingItem } from './types'

export interface HomeData {
  sections: Section[]
  products: Product[]
  shoppingItems: ShoppingItem[]
}

export type ShoppingEntry =
  | { type: 'product'; key: string; product: Product; section: Section | null }
  | { type: 'manual'; key: string; item: ShoppingItem }

/** Две независимые отметки продукта: есть ли он дома и лежит ли в покупках. */
export type ProductState = Pick<Product, 'is_available' | 'to_buy'>

const byTime = (a: string, b: string) => Date.parse(a) - Date.parse(b)

export function sortSections(sections: Section[]): Section[] {
  return [...sections].sort(
    (a, b) => a.sort_order - b.sort_order || byTime(a.created_at, b.created_at),
  )
}

export function productsOf(products: Product[], sectionId: string): Product[] {
  return products
    .filter((p) => p.section_id === sectionId)
    .sort((a, b) => byTime(a.created_at, b.created_at))
}

/**
 * Список покупок — это продукты дома с отметкой `to_buy` плюс позиции, добавленные
 * вручную. Продукт не копируется в список, поэтому не может попасть в него дважды,
 * а удаление продукта или раздела убирает его и из покупок.
 */
export function buildShoppingList(data: HomeData): ShoppingEntry[] {
  const sectionById = new Map(data.sections.map((s) => [s.id, s]))
  const fromHome = data.products
    .filter((p) => p.to_buy)
    .map((product) => ({
      at: product.updated_at,
      entry: {
        type: 'product',
        key: `product:${product.id}`,
        product,
        section: sectionById.get(product.section_id) ?? null,
      } satisfies ShoppingEntry,
    }))
  const manual = data.shoppingItems.map((item) => ({
    at: item.created_at,
    entry: { type: 'manual', key: `item:${item.id}`, item } satisfies ShoppingEntry,
  }))
  // Одним списком в порядке добавления: продукт — по времени, когда его положили в покупки.
  return [...fromHome, ...manual].sort((a, b) => byTime(a.at, b.at)).map(({ entry }) => entry)
}

/**
 * Наличие поменяли вручную. Закончившийся постоянный продукт сам попадает в покупки;
 * продукт, который снова дома, из покупок уходит. То же правило для прежних версий
 * приложения держит триггер products_sync_to_buy.
 */
export function withAvailability(product: Product, available: boolean): ProductState {
  if (available) return { is_available: true, to_buy: false }
  return { is_available: false, to_buy: product.kind === 'staple' ? true : product.to_buy }
}

/** Продукт положили в покупки или убрали из них; наличие при этом не меняется. */
export function withToBuy(product: Product, toBuy: boolean): ProductState {
  return { is_available: product.is_available, to_buy: toBuy }
}

/** Продукт из списка покупок куплен: он дома, покупать больше не нужно. */
export const PURCHASED: ProductState = { is_available: true, to_buy: false }

/* Чистые переходы состояния. Их использует локальный режим; в Supabase то же
   самое делают внешние ключи с каскадом и RPC purchase_shopping_item. */

export function setProductState(data: HomeData, productId: string, state: ProductState, now: string): HomeData {
  if (!data.products.some((p) => p.id === productId)) throw new Error('Продукт не найден')
  return {
    ...data,
    products: data.products.map((p) => (p.id === productId ? { ...p, ...state, updated_at: now } : p)),
  }
}

export function removeProduct(data: HomeData, productId: string): HomeData {
  return { ...data, products: data.products.filter((p) => p.id !== productId) }
}

export function removeSection(data: HomeData, sectionId: string): HomeData {
  return {
    ...data,
    sections: data.sections.filter((s) => s.id !== sectionId),
    products: data.products.filter((p) => p.section_id !== sectionId),
  }
}

export function purchaseManualItem(
  data: HomeData,
  itemId: string,
  sectionId: string,
  makeStaple: boolean,
  ctx: { newId: string; now: string; userId: string | null },
): HomeData {
  const item = data.shoppingItems.find((i) => i.id === itemId)
  if (!item) throw new Error('Позиция покупок не найдена')
  const section = data.sections.find((s) => s.id === sectionId)
  if (!section || section.household_id !== item.household_id) throw new Error('Раздел не найден')
  const kind: ProductKind = makeStaple ? 'staple' : 'one_off'
  const product: Product = {
    id: ctx.newId,
    household_id: item.household_id,
    section_id: sectionId,
    name: item.name,
    icon: item.icon,
    kind,
    is_available: true,
    to_buy: false,
    created_at: ctx.now,
    updated_at: ctx.now,
    created_by: ctx.userId,
  }
  return {
    ...data,
    products: [...data.products, product],
    shoppingItems: data.shoppingItems.filter((i) => i.id !== itemId),
  }
}
