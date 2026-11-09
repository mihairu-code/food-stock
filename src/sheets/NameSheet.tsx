import { useState, type FormEvent } from 'react'
import { Sheet } from './Sheet'

/** Имя, под которым человека видят другие участники дома. */
export function NameSheet({ current, onSave, onClose }: { current: string; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(current)

  function submit(event: FormEvent) {
    event.preventDefault()
    onSave(name.trim())
    onClose()
  }

  return (
    <Sheet title="Ваше имя" description="Его видят другие участники дома." onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>Имя</span>
          <input
            value={name}
            maxLength={40}
            autoComplete="given-name"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <div className="sheet-actions">
          <button className="btn subtle" type="button" onClick={onClose}>
            Отмена
          </button>
          <button className="btn" type="submit">
            Сохранить
          </button>
        </div>
      </form>
    </Sheet>
  )
}
