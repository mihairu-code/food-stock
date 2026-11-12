import { useHouseholdId } from '@/app/session'
import { backend } from '@/data'
import type { NewSection, SectionPatch } from '@/data/backend'
import { useHomeMutation } from './useHomeMutation'

export function useCreateSection() {
  const hid = useHouseholdId()
  return useHomeMutation(
    (input: NewSection) => backend.createSection(hid, input),
    (cache, input) =>
      cache.sections((list) => [
        ...list,
        { ...input, household_id: hid, created_at: new Date().toISOString() },
      ]),
  )
}

export function useUpdateSection() {
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

