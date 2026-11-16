import { useState } from 'react'
import { useUpdateHousehold } from '@/entities/household/api/householdApi'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session/session'
import { NameIconFields } from '@/shared/ui/NameIconFields'
import { FormSheet } from '@/shared/ui/sheet/FormSheet'
import { closeSheet } from '@/shared/ui/sheet/sheetStore'

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
