import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n'
import { Sheet } from './Sheet'

/** Имя, под которым человека видят другие участники дома. */
export function NameSheet({ current, onSave, onClose }: { current: string; onSave: (name: string) => void; onClose: () => void }) {
  const t = useT()
  const [name, setName] = useState(current)

  function submit(event: FormEvent) {
    event.preventDefault()
    onSave(name.trim())
    onClose()
  }

  return (
    <Sheet title={t('name.title')} description={t('name.description')} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>{t('name.label')}</span>
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
            {t('common.cancel')}
          </button>
          <button className="btn" type="submit">
            {t('common.save')}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
