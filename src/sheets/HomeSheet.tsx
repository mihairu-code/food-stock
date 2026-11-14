import { useState } from 'react'
import { useSession } from '@/app/session'
import { NameIconFields } from '@/components'
import { useUpdateHousehold } from '@/data/hooks'
import { useT } from '@/i18n'
import { FormSheet } from './FormSheet'
import { closeSheet } from './sheetStore'

/** Быстрый выбор аватарки дома; остальные иконки — в панели. */
const HOME_EMOJIS = ['🏠', '🏡', '🏢', '🏰', '⛺']

/** Название и аватарка дома. Меняет их владелец. */
export function HomeSheet() {
  const t = useT()
  const { household } = useSession()
  const update = useUpdateHousehold()
  const [name, setName] = useState(household.name)
  const [icon, setIcon] = useState(household.icon ?? '')

  function submit() {
    const next = name.trim()
    if (!next) return
    update.mutate({ name: next, icon: icon || null })
    closeSheet()
  }

  return (
    <FormSheet title={t('homeSheet.title')} submitLabel={t('common.save')} disabled={!name.trim()} onSubmit={submit}>
      <NameIconFields
        id="home-name"
        label={t('renameHome.label')}
        maxLength={80}
        name={name}
        onNameChange={setName}
        icon={icon}
        onIconChange={setIcon}
        icons={HOME_EMOJIS}
        iconHint={t('homeSheet.iconHint')}
      />
    </FormSheet>
  )
}
