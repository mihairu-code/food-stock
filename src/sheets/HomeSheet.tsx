import { useState, type FormEvent } from 'react'
import { useSession } from '@/app/session'
import { EmojiOptions, TextField } from '@/components'
import { useUpdateHousehold } from '@/data/hooks'
import { useT } from '@/i18n'
import { Sheet } from './Sheet'
import { SheetActions } from './SheetActions'
import { closeSheet } from './sheetStore'

/** Быстрый выбор аватарки дома. */
const HOME_EMOJIS = ['🏠', '🏡', '🏢', '🏰', '⛺']

/** Название и аватарка дома. Меняет их владелец. */
export function HomeSheet() {
  const t = useT()
  const { household } = useSession()
  const update = useUpdateHousehold()
  const [name, setName] = useState(household.name)
  const [icon, setIcon] = useState(household.icon ?? '')

  function submit(event: FormEvent) {
    event.preventDefault()
    const next = name.trim()
    if (!next) return
    update.mutate({ name: next, icon: icon || null })
    closeSheet()
  }

  return (
    <Sheet title={t('homeSheet.title')}>
      <form onSubmit={submit}>
        <TextField id="home-name" label={t('renameHome.label')} value={name} onChange={setName} maxLength={80} />
        <EmojiOptions options={HOME_EMOJIS} value={icon} onChange={setIcon} hint={t('homeSheet.iconHint')} />
        <SheetActions submitLabel={t('common.save')} disabled={!name.trim()} />
      </form>
    </Sheet>
  )
}
