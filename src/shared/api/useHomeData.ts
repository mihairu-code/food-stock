import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHouseholdId } from '@/shared/session/session'
import { buildShoppingList, sortSections, type HomeData, type ShoppingEntry } from './homeDataRules'
import { productsQuery, sectionsQuery, shoppingItemsQuery } from './homeQueries'
import type { Section } from './types'

const EMPTY: never[] = []

interface HomeDataState extends HomeData {
  /** Данных ещё нет совсем — показывать нечего. */
  isLoading: boolean
  /** Первая загрузка не удалась. Сбой фонового обновления сюда не попадает: на экране остаются прежние данные. */
  isError: boolean
}

/** Разделы, продукты и ручные покупки текущего дома. */
export function useHomeData(): HomeDataState {
  const hid = useHouseholdId()
  const sections = useQuery(sectionsQuery(hid))
  const products = useQuery(productsQuery(hid))
  const shoppingItems = useQuery(shoppingItemsQuery(hid))
  return {
    sections: sections.data ?? EMPTY,
    products: products.data ?? EMPTY,
    shoppingItems: shoppingItems.data ?? EMPTY,
    isLoading: sections.isPending || products.isPending || shoppingItems.isPending,
    isError: sections.isLoadingError || products.isLoadingError || shoppingItems.isLoadingError,
  }
}

/** Разделы дома в порядке показа. */
export function useSortedSections(): Section[] {
  const { sections } = useHomeData()
  return useMemo(() => sortSections(sections), [sections])
}

/** Список покупок: продукты с отметкой «купить» и позиции, добавленные вручную. */
export function useShoppingList(): ShoppingEntry[] {
  const { sections, products, shoppingItems } = useHomeData()
  return useMemo(
    () => buildShoppingList({ sections, products, shoppingItems }),
    [sections, products, shoppingItems],
  )
}
