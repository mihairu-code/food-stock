import { useState, type FormEvent } from 'react'
import type { NewShoppingItem } from '@/data/backend'
import { useSuggestedEmoji } from '@/hooks/useSuggestedEmoji'
import { useT } from '@/i18n'
import { Sheet } from './Sheet'

/** Позиция покупок, добавленная вручную: того, чего в разделах дома нет. Раздел не нужен. */
export function AddItemSheet({ onSave, onClose }: { onSave: (input: NewShoppingItem) => void; onClose: () => void }) {
  const t = useT()
  const [name, setName] = useState('')
  const { icon, setIcon, options } = useSuggestedEmoji(name)

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({ id: crypto.randomUUID(), name: trimmed, icon: icon || null })
    onClose()
  }

  return (
    <Sheet title={t('shopping.addTitle')} description={t('shopping.addDescription')} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>{t('shopping.whatToBuy')}</span>
          <input
            value={name}
            maxLength={80}
            placeholder={t('shopping.placeholder')}
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
        <div className="sheet-actions">
          <button className="btn subtle" type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn" type="submit" disabled={!name.trim()}>
            {t('common.add')}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
