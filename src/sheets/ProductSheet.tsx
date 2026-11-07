import { useState, type FormEvent } from 'react'
import type { NewProduct } from '@/data/backend'
import type { Section } from '@/domain/types'
import { Sheet } from './Sheet'

/** Частые продукты; своё эмодзи можно вписать в поле. */
const PRODUCT_EMOJIS = ['🥛', '🥚', '🧀', '🍞', '☕', '🍚', '🍎', '🥦', '🍫', '🧻']

interface ProductSheetProps {
  sections: Section[]
  /** Раздел, из которого шторку открыли. */
  sectionId?: string
  onSave: (input: NewProduct) => void
  onClose: () => void
}

export function ProductSheet({ sections, sectionId: initialSectionId, onSave, onClose }: ProductSheetProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [sectionId, setSectionId] = useState(initialSectionId ?? sections[0]?.id ?? '')
  const [staple, setStaple] = useState(true)

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !sectionId) return
    onSave({ section_id: sectionId, name: trimmed, icon: icon.trim() || null, kind: staple ? 'staple' : 'one_off' })
    onClose()
  }

  return (
    <Sheet title="Новый продукт" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>Название</span>
          <input
            value={name}
            maxLength={80}
            placeholder="Например, молоко"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <div className="field">
          <span>Иконка</span>
          <div className="emoji-grid">
            {PRODUCT_EMOJIS.map((emoji) => (
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
        <label className="field">
          <span>Раздел</span>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.icon ? `${section.icon} ${section.name}` : section.name}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={staple} onChange={(e) => setStaple(e.target.checked)} />
          <span>
            Постоянный
            <small>Закончится — сам попадёт в покупки</small>
          </span>
        </label>
        <div className="sheet-actions">
          <button className="btn subtle" type="button" onClick={onClose}>
            Отмена
          </button>
          <button className="btn" type="submit" disabled={!name.trim() || !sectionId}>
            Добавить
          </button>
        </div>
      </form>
    </Sheet>
  )
}
