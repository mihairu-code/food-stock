import { useState } from 'react'
import { NameIconFields } from '@/components'
import { useCreateSection, useHomeData, useUpdateSection } from '@/data/hooks'
import type { Section } from '@/domain/types'
import { useT } from '@/i18n'
import { notify } from '@/lib/toast'
import { FormSheet } from './FormSheet'
import { closeSheet } from './sheetStore'

/** Самые частые места в доме; остальные иконки — в панели. */
const SECTION_EMOJIS = ['🧊', '🧺', '🍪', '🥫', '🧴']

interface SectionSheetProps {
  /** Раздел для переименования; без него шторка создаёт новый. */
  section?: Section
  onRequestDelete?: () => void
}

export function SectionSheet({ section, onRequestDelete }: SectionSheetProps) {
  const t = useT()
  const { sections } = useHomeData()
  const createSection = useCreateSection()
  const updateSection = useUpdateSection()
  const [name, setName] = useState(section?.name ?? '')
  const [icon, setIcon] = useState(section?.icon ?? '')

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (section) {
      updateSection.mutate({ id: section.id, patch: { name: trimmed, icon: icon || null } })
    } else {
      const sort_order = sections.reduce((max, s) => Math.max(max, s.sort_order + 1), 0)
      createSection.mutate({ id: crypto.randomUUID(), name: trimmed, icon: icon || null, sort_order })
      notify('toast.sectionCreated', { name: trimmed })
    }
    closeSheet()
  }

  return (
    <FormSheet
      title={t(section ? 'section.title' : 'section.newTitle')}
      description={section ? undefined : t('section.newDescription')}
      submitLabel={t(section ? 'common.save' : 'common.create')}
      disabled={!name.trim()}
      onSubmit={submit}
      footer={
        section &&
        onRequestDelete && (
          <button className="btn danger-text" type="button" onClick={onRequestDelete}>
            {t('section.delete')}
          </button>
        )
      }
    >
      <NameIconFields
        id="section-name"
        label={t('section.name')}
        maxLength={60}
        name={name}
        onNameChange={setName}
        icon={icon}
        onIconChange={setIcon}
        icons={SECTION_EMOJIS}
      />
    </FormSheet>
  )
}
