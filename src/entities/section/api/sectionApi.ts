import { backend, placeSections, useHomeMutation, type NewSection, type SectionPatch } from '@/shared/api'
import { useHouseholdId } from '@/shared/session'


export function useCreateSection() {
  const householdId = useHouseholdId()
  return useHomeMutation(
    (input: NewSection) => backend.createSection(householdId, input),
    (cache, input) =>
      cache.sections((list) => [
        ...list,
        { ...input, household_id: householdId, created_at: new Date().toISOString() },
      ]),
  )
}

export function useRenameSection() {
  return useHomeMutation(
    ({ id, patch }: { id: string; patch: SectionPatch }) => backend.updateSection(id, patch),
    (cache, { id, patch }) =>
      cache.sections((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s))),
  )
}

export function useDeleteSection() {
  return useHomeMutation(
    (sectionId: string) => backend.deleteSection(sectionId),
    (cache, sectionId) => {
      cache.sections((list) => list.filter((s) => s.id !== sectionId))
      cache.products((list) => list.filter((p) => p.section_id !== sectionId))
    },
  )
}

/** Новый порядок разделов после перетаскивания: идентификаторы сверху вниз. */
export function useReorderSections() {
  return useHomeMutation(
    (sectionIds: string[]) => backend.reorderSections(sectionIds),
    (cache, sectionIds) => cache.sections((list) => placeSections(list, sectionIds)),
  )
}
