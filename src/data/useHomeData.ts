import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHouseholdId } from '@/app/session'
import { buildShoppingList, sortSections, type HomeData, type ShoppingEntry } from '@/domain/logic'
import type { Section } from '@/domain/types'
import { backend } from './index'
import { qk } from './keys'

const EMPTY: never[] = []

interface HomeDataState extends HomeData {
  isLoading: boolean
  isError: boolean
}

/** Разделы, продукты и ручные покупки текущего дома. */
export function useHomeData(): HomeDataState {
  const hid = useHouseholdId()
  const sections = useQuery({ queryKey: qk.sections(hid), queryFn: () => backend.listSections(hid) })
  const products = useQuery({ queryKey: qk.products(hid), queryFn: () => backend.listProducts(hid) })
  const shoppingItems = useQuery({
    queryKey: qk.shoppingItems(hid),
    queryFn: () => backend.listShoppingItems(hid),
  })
  return {
    sections: sections.data ?? EMPTY,
    products: products.data ?? EMPTY,
    shoppingItems: shoppingItems.data ?? EMPTY,
    isLoading: sections.isPending || products.isPending || shoppingItems.isPending,
    isError: sections.isError || products.isError || shoppingItems.isError,
  }
}

export function useSortedSections(): Section[] {
  const { sections } = useHomeData()
  return useMemo(() => sortSections(sections), [sections])
}

/** Список покупок: закончившиеся постоянные продукты и позиции, добавленные вручную. */
export function useShoppingList(): ShoppingEntry[] {
  const { sections, products, shoppingItems } = useHomeData()
  return useMemo(
    () => buildShoppingList({ sections, products, shoppingItems }),
    [sections, products, shoppingItems],
  )
}
