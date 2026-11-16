import { useMemo } from 'react'
import { useHomeData } from '@/shared/api'
import { buildShoppingList, type ShoppingEntry } from './buildShoppingList'

/** Список покупок текущего дома: продукты с отметкой «купить» и позиции, добавленные вручную. */
export function useShoppingList(): ShoppingEntry[] {
  const { sections, products, shoppingItems } = useHomeData()
  return useMemo(() => buildShoppingList({ sections, products, shoppingItems }), [sections, products, shoppingItems])
}
