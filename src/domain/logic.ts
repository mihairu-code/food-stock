import type { Product, ProductKind, Section, ShoppingItem } from './types'

export interface HomeData {
  sections: Section[]
  products: Product[]
  shoppingItems: ShoppingItem[]
}

export type ShoppingEntry =
  | { type: 'product'; key: string; product: Product; section: Section | null }
  | { type: 'manual'; key: string; item: ShoppingItem }

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
 * Список покупок не хранится: это закончившиеся постоянные продукты плюс позиции,
 * добавленные вручную. Поэтому продукт не попадёт в список дважды, а удаление
 * продукта или раздела убирает его и из покупок.
 */
export function buildShoppingList(data: HomeData): ShoppingEntry[] {
  const sectionById = new Map(data.sections.map((s) => [s.id, s]))
  const fromHome: ShoppingEntry[] = data.products
    .filter((p) => p.kind === 'staple' && !p.is_available)
    .sort((a, b) => byTime(a.updated_at, b.updated_at))
    .map((product) => ({
      type: 'product',
      key: `product:${product.id}`,
      product,
      section: sectionById.get(product.section_id) ?? null,
    }))
  const manual: ShoppingEntry[] = [...data.shoppingItems]
    .sort((a, b) => byTime(a.created_at, b.created_at))
    .map((item) => ({ type: 'manual', key: `item:${item.id}`, item }))
  return [...fromHome, ...manual]
}

/* Чистые переходы состояния. Их использует локальный режим; в Supabase то же
   самое делают внешние ключи с каскадом и RPC purchase_shopping_item. */

export function setAvailability(
  data: HomeData,
  productId: string,
  available: boolean,
  now: string,
): HomeData {
  const product = data.products.find((p) => p.id === productId)
  if (!product) throw new Error('Продукт не найден')
  // Разовый продукт существует, только пока он есть дома (как check в базе).
  if (product.kind === 'one_off' && !available) throw new Error('Разовый продукт нельзя отметить закончившимся')
  return {
    ...data,
    products: data.products.map((p) =>
      p.id === productId ? { ...p, is_available: available, updated_at: now } : p,
    ),
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
