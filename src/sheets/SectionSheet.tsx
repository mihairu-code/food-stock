import { useState, type FormEvent } from 'react'
import type { Section } from '@/domain/types'
import { useT } from '@/i18n'
import { Sheet } from './Sheet'

/** Самые частые места в доме. */
const SECTION_EMOJIS = ['🧊', '🧺', '🍪', '🥫', '🧴', '❄️']

interface SectionSheetProps {
  /** Раздел для переименования; без него шторка создаёт новый. */
  section?: Section
  onSave: (name: string, icon: string | null) => void
  onDelete?: () => void
  onClose: () => void
}

export function SectionSheet({ section, onSave, onDelete, onClose }: SectionSheetProps) {
  const t = useT()
  const [name, setName] = useState(section?.name ?? '')
  const [icon, setIcon] = useState(section?.icon ?? '')

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed, icon || null)
    onClose()
  }

  return (
    <Sheet
      title={t(section ? 'section.title' : 'section.newTitle')}
      description={section ? undefined : t('section.newDescription')}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label className="field">
          <span>{t('section.name')}</span>
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div className="field">
          <span>{t('emoji.label')}</span>
          <div className="emoji-grid">
            {SECTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="emoji-option"
                type="button"
                aria-pressed={icon === emoji}
                onClick={() => setIcon(icon === emoji ? '' : emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="sheet-actions">
          <button className="btn subtle" type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn" type="submit" disabled={!name.trim()}>
            {t(section ? 'common.save' : 'common.create')}
          </button>
        </div>
        {onDelete && (
          <button className="btn danger-text" type="button" onClick={onDelete}>
            {t('section.delete')}
          </button>
        )}
      </form>
    </Sheet>
  )
}
