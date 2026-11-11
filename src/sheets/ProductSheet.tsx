import { useState, type FormEvent } from 'react'
import type { NewProduct } from '@/data/backend'
import type { Section } from '@/domain/types'
import { useSuggestedEmoji } from '@/hooks/useSuggestedEmoji'
import { useT } from '@/i18n'
import { Sheet } from './Sheet'

interface ProductSheetProps {
  sections: Section[]
  /** Раздел, из которого шторку открыли. */
  sectionId?: string
  onSave: (input: NewProduct) => void
  onClose: () => void
}

export function ProductSheet({ sections, sectionId: initialSectionId, onSave, onClose }: ProductSheetProps) {
  const t = useT()
  const [name, setName] = useState('')
  const { icon, setIcon, options } = useSuggestedEmoji(name)
  const [sectionId, setSectionId] = useState(initialSectionId ?? sections[0]?.id ?? '')
  const [staple, setStaple] = useState(true)

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !sectionId) return
    onSave({ id: crypto.randomUUID(), section_id: sectionId, name: trimmed, icon: icon || null, kind: staple ? 'staple' : 'one_off' })
    onClose()
  }

  return (
    <Sheet title={t('productSheet.title')} description={t('productSheet.description')} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>{t('productSheet.name')}</span>
          <input
            value={name}
            maxLength={80}
            placeholder={t('productSheet.placeholder')}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <div className="field">
          <span>
            {t('emoji.label')} <small>{t('emoji.hint')}</small>
          </span>
          <div className="emoji-grid">
            {options.map((emoji) => (
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
          <span>{t('field.section')}</span>
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
            {t('product.keep')}
            <small>{t('product.keepHint')}</small>
          </span>
        </label>
        <div className="sheet-actions">
          <button className="btn subtle" type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn" type="submit" disabled={!name.trim() || !sectionId}>
            {t('common.add')}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
