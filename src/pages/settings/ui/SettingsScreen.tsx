import { LogOut } from 'lucide-react'
import { backend } from '@/shared/api/currentBackend'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session/session'
import { Hint } from '@/shared/ui/Hint'
import { SettingRow } from '@/shared/ui/SettingRow'
import { SettingsGroup } from '@/shared/ui/SettingsGroup'
import { openSheet } from '@/shared/ui/sheet/sheetStore'
import { AccountGroup } from './AccountGroup'
import { AppGroup } from './AppGroup'
import { HomeGroup } from './HomeGroup'
import { MembersGroup } from './MembersGroup'

export function SettingsScreen() {
  const t = useT()
  const { user } = useSession()

  if (backend.mode === 'local') {
    return (
      <>
        <Hint label={t('settings.demoLabel')}>{t('settings.demoText')}</Hint>
        <HomeGroup />
        <AppGroup />
        <SettingsGroup label={t('settings.groupData')}>
          <SettingRow
            danger
            title={t('settings.reset')}
            meta={t('settings.resetMeta')}
            onClick={() => openSheet({ type: 'reset' })}
          />
        </SettingsGroup>
      </>
    )
  }

  return (
    <>
      <HomeGroup />
      <MembersGroup />
      <AccountGroup />
      <AppGroup />
      {!user.isAnonymous && (
        <button className="btn subtle sign-out" type="button" onClick={() => openSheet({ type: 'sign-out' })}>
          <LogOut size={16} aria-hidden="true" /> {t('settings.signOut')}
        </button>
      )}
    </>
  )
}
