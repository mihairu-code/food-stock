import { useState } from 'react'
import { useSetDisplayName } from '@/entities/household/api/householdApi'
import { saveName } from '@/entities/invite/lib/inviteToken'
import { useT } from '@/shared/i18n'
import { TextField } from '@/shared/ui/TextField'
import { FormSheet } from '@/shared/ui/sheet/FormSheet'
import { closeSheet } from '@/shared/ui/sheet/sheetStore'

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
