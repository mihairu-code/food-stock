import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHouseholdId } from '@/shared/session'
import type { HomeData } from './homeDataRules'
import { productsQuery, sectionsQuery, shoppingItemsQuery } from './homeQueries'
import { usePendingRemovals, withoutPendingRemovals } from './pendingRemovals'

const EMPTY: never[] = []

interface HomeDataState extends HomeData {
  /** Данных ещё нет совсем — показывать нечего. */
  isLoading: boolean
  /** Первая загрузка не удалась. Сбой фонового обновления сюда не попадает: на экране остаются прежние данные. */
  isError: boolean
}

/**
 * Разделы, продукты и ручные покупки текущего дома. Удалённое, которое ещё можно
 * вернуть из тоста, сюда уже не попадает.
 */
export function useHomeData(): HomeDataState {
  const householdId = useHouseholdId()
  const sections = useQuery(sectionsQuery(householdId))
  const products = useQuery(productsQuery(householdId))
  const shoppingItems = useQuery(shoppingItemsQuery(householdId))
  const hidden = usePendingRemovals()
  // Списки пересобираются, только когда меняются данные или скрытое: строки списков
  // сравнивают их по ссылке.
  const visible = useMemo(
    () =>
      withoutPendingRemovals(
        {
          sections: sections.data ?? EMPTY,
          products: products.data ?? EMPTY,
          shoppingItems: shoppingItems.data ?? EMPTY,
        },
        hidden,
      ),
    [sections.data, products.data, shoppingItems.data, hidden],
  )
  return {
    ...visible,
    isLoading: sections.isPending || products.isPending || shoppingItems.isPending,
    isError: sections.isLoadingError || products.isLoadingError || shoppingItems.isLoadingError,
  }
}
