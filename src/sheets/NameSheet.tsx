import { useState, type FormEvent } from 'react'
import { useSetDisplayName } from '@/data/hooks'
import { useT } from '@/i18n'
import { saveName } from '@/lib/invite'
import { Sheet } from './Sheet'
import { SheetActions } from './SheetActions'
import { closeSheet } from './sheetStore'

/** Имя, под которым человека видят другие участники дома. */
export function NameSheet({ current }: { current: string }) {
  const t = useT()
  const setDisplayName = useSetDisplayName()
  const [name, setName] = useState(current)

  function submit(event: FormEvent) {
    event.preventDefault()
    const next = name.trim()
    saveName(next)
    setDisplayName.mutate(next)
    closeSheet()
  }

  return (
    <Sheet title={t('name.title')} description={t('name.description')}>
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
        <SheetActions submitLabel={t('common.save')} />
      </form>
    </Sheet>
  )
}
