import { useState } from 'react'
import { useCreateSection, useRenameSection } from '@/entities/section'
import { useHomeData, type Section } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { findNamed } from '@/shared/lib/sameName'
import { notify } from '@/shared/lib/toast'
import { useFieldError } from '@/shared/lib/useFieldError'
import { closeSheet, FormSheet, NameIconFields } from '@/shared/ui'

/** Самые частые места в доме; остальные иконки — в панели. */
const SECTION_EMOJIS = ['🧊', '🧺', '🍪', '🥫', '🧴']

interface SectionSheetProps {
  /** Раздел для переименования; без него шторка создаёт новый. */
  section?: Section
  onRequestDelete?: () => void
}

/**
 * Создание и переименование раздела. Второй раздел с тем же названием не заводится (как
 * у продуктов, решение 0017): поле встряхивается. Сам раздел своё название не занимает —
 * можно сменить только иконку.
 */
export function SectionSheet({ section, onRequestDelete }: SectionSheetProps) {
  const t = useT()
  const { sections } = useHomeData()
  const createSection = useCreateSection()
  const renameSection = useRenameSection()
  const [name, setName] = useState(section?.name ?? '')
  const [icon, setIcon] = useState(section?.icon ?? '')
  const nameError = useFieldError()

  function changeName(next: string) {
    setName(next)
    nameError.clear()
  }

  function saveSection() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (findNamed(sections, trimmed, section?.id)) {
      nameError.reject(t('section.duplicate'))
      return
    }
    if (section) {
      renameSection.mutate({ id: section.id, patch: { name: trimmed, icon: icon || null } })
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
      onSubmit={saveSection}
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
        onNameChange={changeName}
        nameError={nameError.error}
        nameShakeCount={nameError.shakeCount}
        icon={icon}
        onIconChange={setIcon}
        icons={SECTION_EMOJIS}
      />
    </FormSheet>
  )
}
