import { useState, type FormEvent } from 'react'
import type { Section } from '@/domain/types'
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
      title={section ? 'Раздел' : 'Новый раздел'}
      description={section ? undefined : 'Например, «Холодильник» или «Вкусняшки».'}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label className="field">
          <span>Название</span>
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div className="field">
          <span>Иконка</span>
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
            Отмена
          </button>
          <button className="btn" type="submit" disabled={!name.trim()}>
            {section ? 'Сохранить' : 'Создать'}
          </button>
        </div>
        {onDelete && (
          <button className="btn danger-text" type="button" onClick={onDelete}>
            Удалить раздел
          </button>
        )}
      </form>
    </Sheet>
  )
}
