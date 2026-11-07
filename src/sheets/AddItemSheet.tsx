import { useState, type FormEvent } from 'react'
import type { NewShoppingItem } from '@/data/backend'
import { Sheet } from './Sheet'

/** Позиция покупок, добавленная вручную: того, чего в разделах дома нет. Раздел не нужен. */
export function AddItemSheet({ onSave, onClose }: { onSave: (input: NewShoppingItem) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({ name: trimmed, icon: icon.trim() || null })
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
        <label className="field">
          <span>Эмодзи (необязательно)</span>
          <input value={icon} maxLength={8} onChange={(e) => setIcon(e.target.value)} />
        </label>
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
