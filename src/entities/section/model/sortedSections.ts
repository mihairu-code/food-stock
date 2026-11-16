import { useMemo } from 'react'
import { useHomeData, type Section } from '@/shared/api'
import { compareTimes } from '@/shared/lib/compareTimes'

/** Разделы в порядке показа: по месту, которое им дали перетаскиванием, затем по времени создания. */
export function sortSections(sections: Section[]): Section[] {
  return [...sections].sort((a, b) => a.sort_order - b.sort_order || compareTimes(a.created_at, b.created_at))
}

/** Разделы текущего дома в порядке показа. */
export function useSortedSections(): Section[] {
  const { sections } = useHomeData()
  return useMemo(() => sortSections(sections), [sections])
}
