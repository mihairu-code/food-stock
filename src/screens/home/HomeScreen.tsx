import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useHouseholdId } from '@/app/session'
import { EmptyState } from '@/components/EmptyState'
import { backend } from '@/data'
import { useHomeData, useSortedSections } from '@/data/useHomeData'
import { useHomeMutation } from '@/data/useHomeMutation'
import { productsOf } from '@/domain/logic'
import type { Section } from '@/domain/types'
import { ConfirmSheet } from '@/sheets/ConfirmSheet'
import { SectionSheet } from '@/sheets/SectionSheet'
import { SectionCard } from './SectionCard'
import { useCollapsedSections } from './useCollapsedSections'

type HomeSheet =
  | { type: 'add-section' }
  | { type: 'edit-section'; section: Section }
  | { type: 'delete-section'; section: Section }

export function HomeScreen() {
  const hid = useHouseholdId()
  const { products, isLoading, isError } = useHomeData()
  const sections = useSortedSections()
  const collapsed = useCollapsedSections()
  const [sheet, setSheet] = useState<HomeSheet | null>(null)
  const close = () => setSheet(null)

  const createSection = useHomeMutation((v: { name: string; icon: string | null }) =>
    backend.createSection(hid, {
      ...v,
      sort_order: sections.reduce((max, s) => Math.max(max, s.sort_order + 1), 0),
    }),
  )
  const updateSection = useHomeMutation((v: { id: string; name: string; icon: string | null }) =>
    backend.updateSection(v.id, { name: v.name, icon: v.icon }),
  )
  const deleteSection = useHomeMutation((id: string) => backend.deleteSection(id))

  if (isLoading) return <p className="status">Загрузка…</p>
  if (isError) return <p className="status">Не удалось загрузить данные</p>

  function requestDelete(section: Section) {
    // Пустой раздел удаляем сразу, непустой — только после подтверждения.
    if (productsOf(products, section.id).length === 0) {
      deleteSection.mutate(section.id)
      close()
    } else {
      setSheet({ type: 'delete-section', section })
    }
  }

  return (
    <>
      {sections.length === 0 ? (
        <EmptyState emoji="🏠" title="Пока пусто" text="Заведите первый раздел — например, «Холодильник».">
          <button className="btn" type="button" onClick={() => setSheet({ type: 'add-section' })}>
            <Plus size={16} /> Создать раздел
          </button>
        </EmptyState>
      ) : (
        <>
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              count={productsOf(products, section.id).length}
              open={!collapsed.ids.includes(section.id)}
              onToggle={() => collapsed.toggle(section.id)}
              onEdit={() => setSheet({ type: 'edit-section', section })}
            />
          ))}
          <button className="add-row" type="button" onClick={() => setSheet({ type: 'add-section' })}>
            <Plus size={16} aria-hidden="true" /> Новый раздел
          </button>
        </>
      )}

      {sheet?.type === 'add-section' && (
        <SectionSheet onSave={(name, icon) => createSection.mutate({ name, icon })} onClose={close} />
      )}
      {sheet?.type === 'edit-section' && (
        <SectionSheet
          section={sheet.section}
          onSave={(name, icon) => updateSection.mutate({ id: sheet.section.id, name, icon })}
          onDelete={() => requestDelete(sheet.section)}
          onClose={close}
        />
      )}
      {sheet?.type === 'delete-section' && (
        <ConfirmSheet
          title={`Удалить «${sheet.section.name}»?`}
          description="Вместе с разделом удалятся все его продукты, в том числе те, что сейчас в покупках."
          confirmLabel="Удалить"
          onConfirm={() => deleteSection.mutate(sheet.section.id)}
          onClose={close}
        />
      )}
    </>
  )
}
