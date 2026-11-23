import { NEW_PRODUCT_KIND, type Product, type Section, type ShoppingItem } from './types'

/*
 * Правила данных дома, которые повторяют поведение базы: их выполняет локальный
 * демо-режим вместо Postgres, а оптимистичные правки — до ответа сервера. В Supabase
 * то же самое делают внешние ключи с каскадом, триггеры и RPC.
 */

export interface HomeData {
  sections: Section[]
  products: Product[]
  shoppingItems: ShoppingItem[]
}

/** Две независимые отметки продукта: есть ли он дома и лежит ли в покупках. */
export type ProductState = Pick<Product, 'is_available' | 'to_buy'>

/**
 * Список покупок после перетаскивания: идентификаторы продуктов и ручных позиций
 * вперемешку, сверху вниз. Как и перестановка в разделе, updated_at не меняет.
 */
export function placeShopping(
  data: Pick<HomeData, 'products' | 'shoppingItems'>,
  ids: string[],
): Pick<HomeData, 'products' | 'shoppingItems'> {
  const places = new Map(ids.map((id, index) => [id, index + 1]))
  return {
    products: data.products.map((product) => {
      const place = places.get(product.id)
      return place === undefined || product.shopping_order === place ? product : { ...product, shopping_order: place }
    }),
    shoppingItems: data.shoppingItems.map((item) => {
      const place = places.get(item.id)
      return place === undefined || item.sort_order === place ? item : { ...item, sort_order: place }
    }),
  }
}

/**
 * Продукт с новыми отметками. Продукт, который положили в покупки заново, встаёт
 * в конец списка: прежнее место в покупках ему не возвращается.
 */
export function withState(product: Product, state: ProductState, now: string): Product {
  return {
    ...product,
    is_available: state.is_available,
    to_buy: state.to_buy,
    shopping_order: state.to_buy === product.to_buy ? product.shopping_order : null,
    updated_at: now,
  }
}

export function setProductState(
  data: HomeData,
  productId: string,
  state: ProductState,
  now: string,
): HomeData {
  if (!data.products.some((p) => p.id === productId)) throw new Error('Продукт не найден')
  return {
    ...data,
    products: data.products.map((p) => (p.id === productId ? withState(p, state, now) : p)),
  }
}

/**
 * Раздел после перетаскивания: перечисленные продукты оказываются в нём в этом порядке.
 * Так же записывается и перенос из другого раздела — продукт просто есть в списке.
 * Перестановка не меняет updated_at: по нему упорядочен список покупок.
 */
export function placeProducts(products: Product[], sectionId: string, productIds: string[]): Product[] {
  const places = new Map(productIds.map((id, index) => [id, index + 1]))
  return products.map((product) => {
    const place = places.get(product.id)
    if (place === undefined) return product
    if (product.section_id === sectionId && product.sort_order === place) return product
    return { ...product, section_id: sectionId, sort_order: place }
  })
}

/** Разделы в новом порядке; не перечисленные остаются на своих местах. */
export function placeSections(sections: Section[], sectionIds: string[]): Section[] {
  const places = new Map(sectionIds.map((id, index) => [id, index + 1]))
  return sections.map((section) => {
    const place = places.get(section.id)
    return place === undefined || section.sort_order === place ? section : { ...section, sort_order: place }
  })
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
  ctx: { newId: string; now: string; userId: string | null },
): HomeData {
  const item = data.shoppingItems.find((i) => i.id === itemId)
  if (!item) throw new Error('Позиция покупок не найдена')
  const section = data.sections.find((s) => s.id === sectionId)
  if (!section || section.household_id !== item.household_id) throw new Error('Раздел не найден')
  const product: Product = {
    id: ctx.newId,
    household_id: item.household_id,
    section_id: sectionId,
    name: item.name,
    icon: item.icon,
    kind: NEW_PRODUCT_KIND,
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
