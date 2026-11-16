import { useState } from 'react'
import { useSetDisplayName } from '@/entities/member'
import { useT } from '@/shared/i18n'
import { saveName } from '@/shared/lib/userName'
import { closeSheet, FormSheet, TextField } from '@/shared/ui'

/** Имя, под которым человека видят другие участники дома. */
export function DisplayNameSheet({ current }: { current: string }) {
  const t = useT()
  const setDisplayName = useSetDisplayName()
  const [name, setName] = useState(current)

  function saveDisplayName() {
    const next = name.trim()
    saveName(next)
    setDisplayName.mutate(next)
    closeSheet()
  }

  return (
    <FormSheet title={t('name.title')} description={t('name.description')} submitLabel={t('common.save')} onSubmit={saveDisplayName}>
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
