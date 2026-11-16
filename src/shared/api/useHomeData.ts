import { useQuery } from '@tanstack/react-query'
import { useHouseholdId } from '@/shared/session'
import type { HomeData } from './homeDataRules'
import { productsQuery, sectionsQuery, shoppingItemsQuery } from './homeQueries'

const EMPTY: never[] = []

interface HomeDataState extends HomeData {
  /** Данных ещё нет совсем — показывать нечего. */
  isLoading: boolean
  /** Первая загрузка не удалась. Сбой фонового обновления сюда не попадает: на экране остаются прежние данные. */
  isError: boolean
}

/** Разделы, продукты и ручные покупки текущего дома. */
export function useHomeData(): HomeDataState {
  const householdId = useHouseholdId()
  const sections = useQuery(sectionsQuery(householdId))
  const products = useQuery(productsQuery(householdId))
  const shoppingItems = useQuery(shoppingItemsQuery(householdId))
  return {
    sections: sections.data ?? EMPTY,
    products: products.data ?? EMPTY,
    shoppingItems: shoppingItems.data ?? EMPTY,
    isLoading: sections.isPending || products.isPending || shoppingItems.isPending,
    isError: sections.isLoadingError || products.isLoadingError || shoppingItems.isLoadingError,
  }
}
