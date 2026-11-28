import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useCreateSection } from '@/entities/section'
import { useT } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { EmptyState, openSheet } from '@/shared/ui'
import { initialChecks, READY_SECTIONS, sectionsToCreate, type ReadySection } from '../model/readySections'

/**
 * Пустой дом: готовые разделы кнопками. Отмечают несколько, «Создать» заводит все разом.
 * «Свой раздел» добавляет к ним ещё одну кнопку, уже отмеченную, — создаётся вместе с
 * остальными: если бы он создавался сразу, дом перестал бы быть пустым, и отмеченные
 * кнопки пропали бы несозданными.
 */
export function ReadySections() {
  const t = useT()
  const createSection = useCreateSection()
  const [checks, setChecks] = useState(initialChecks)
  const [own, setOwn] = useState<{ id: string; name: string; icon: string }[]>([])

  const chips: ReadySection[] = [
    ...READY_SECTIONS.map(({ id, key, icon }) => ({ id, name: t(key), icon, checked: checks[id] })),
    ...own.map((section) => ({ ...section, checked: checks[section.id] })),
  ]
  const count = chips.filter((chip) => chip.checked).length

  const toggle = (id: string) => setChecks((current) => ({ ...current, [id]: !current[id] }))

  function addOwn() {
    openSheet({
      type: 'add-section',
      pick: {
        taken: chips.map((chip) => chip.name),
        onPick: ({ name, icon }) => {
          const id = crypto.randomUUID()
          setOwn((list) => [...list, { id, name, icon }])
          setChecks((current) => ({ ...current, [id]: true }))
        },
      },
    })
  }

  function create() {
    const sections = sectionsToCreate(chips)
    for (const section of sections) createSection.mutate({ id: crypto.randomUUID(), ...section })
    if (sections.length === 1) notify('toast.sectionCreated', { name: sections[0].name })
    else notify('toast.sectionsCreated', { count: sections.length })
  }

  return (
    <EmptyState emoji="🏠" title={t('home.emptyTitle')} text={t('home.emptyText')}>
      <div className="ready-sections" role="group" aria-label={t('home.readyLabel')}>
        {chips.map((chip) => (
          <button
            key={chip.id}
            className="chip"
            type="button"
            role="checkbox"
            aria-checked={chip.checked}
            onClick={() => toggle(chip.id)}
          >
            {chip.icon && <span aria-hidden="true">{chip.icon}</span>}
            {chip.name}
          </button>
        ))}
        <button className="chip ready-own" type="button" onClick={addOwn}>
          <Plus size={16} aria-hidden="true" /> {t('home.readyOwn')}
        </button>
      </div>
      <button className="btn" type="button" disabled={count === 0} onClick={create}>
        {count > 0 ? t('home.createSections', { count }) : t('common.create')}
      </button>
    </EmptyState>
  )
}
