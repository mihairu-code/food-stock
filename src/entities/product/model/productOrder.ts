import type { Product } from '@/shared/api'
import { compareTimes } from '@/shared/lib/compareTimes'
import { findNamed } from '@/shared/lib/sameName'

/** Продукты, которые переставляли, идут по своим местам; остальные — после них, по времени добавления. */
const byPlace = (a: Product, b: Product) =>
  (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity) || compareTimes(a.created_at, b.created_at)

/** Продукты по разделам за один проход, в порядке показа. */
export function groupProductsBySection(products: Product[]): Map<string, Product[]> {
  const groups = new Map<string, Product[]>()
  for (const product of [...products].sort(byPlace)) {
    const group = groups.get(product.section_id)
    if (group) group.push(product)
    else groups.set(product.section_id, [product])
  }
  return groups
}

/** Продукт с таким же названием, если он уже есть в доме; сам редактируемый продукт не в счёт. */
export const findProductNamed = (products: Product[], name: string, exceptId?: string): Product | undefined =>
  findNamed(products, name, exceptId)
