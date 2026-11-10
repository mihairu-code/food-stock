import { useState, type FormEvent } from 'react'
import type { NewShoppingItem } from '@/data/backend'
import { useSuggestedEmoji } from '@/hooks/useSuggestedEmoji'
import { Sheet } from './Sheet'

/** Позиция покупок, добавленная вручную: того, чего в разделах дома нет. Раздел не нужен. */
export function AddItemSheet({ onSave, onClose }: { onSave: (input: NewShoppingItem) => void; onClose: () => void }) {
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
    <Sheet title="Добавить в покупки" description="Раздел выберете, когда купите." onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>Что купить</span>
          <input
            value={name}
            maxLength={80}
            placeholder="Например, батарейки"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <div className="field">
          <span>Иконка</span>
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
            Отмена
          </button>
          <button className="btn" type="submit" disabled={!name.trim()}>
            Добавить
          </button>
        </div>
      </form>
    </Sheet>
  )
}
