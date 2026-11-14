import { useState } from 'react'
import { TextField } from '@/components'
import { useSetDisplayName } from '@/data/hooks'
import { useT } from '@/i18n'
import { saveName } from '@/lib/invite'
import { FormSheet } from './FormSheet'
import { closeSheet } from './sheetStore'

/** Имя, под которым человека видят другие участники дома. */
export function NameSheet({ current }: { current: string }) {
  const t = useT()
  const setDisplayName = useSetDisplayName()
  const [name, setName] = useState(current)

  function submit() {
    const next = name.trim()
    saveName(next)
    setDisplayName.mutate(next)
    closeSheet()
  }

  return (
    <FormSheet title={t('name.title')} description={t('name.description')} submitLabel={t('common.save')} onSubmit={submit}>
      <TextField
        id="my-name"
        label={t('name.label')}
        value={name}
        onChange={setName}
        maxLength={40}
        autoFocus
        autoComplete="given-name"
      />
    </FormSheet>
  )
}
