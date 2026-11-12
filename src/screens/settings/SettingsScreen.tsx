import { LogOut } from 'lucide-react'
import { useSession } from '@/app/session'
import { SettingRow, SettingsGroup } from '@/components'
import { backend } from '@/data'
import { useT } from '@/i18n'
import { openSheet } from '@/sheets'
import { AccountGroup } from './AccountGroup'
import { AppGroup } from './AppGroup'
import { MembersGroup } from './MembersGroup'

export function SettingsScreen() {
  const t = useT()
  const { user } = useSession()

  if (backend.mode === 'local') {
    return (
      <>
        <AppGroup />
        <SettingsGroup label={t('settings.groupData')}>
          <SettingRow
            danger
            title={t('settings.reset')}
            meta={t('settings.resetMeta')}
            onClick={() => openSheet({ type: 'reset' })}
          />
        </SettingsGroup>
        <p className="settings-note">{t('settings.demoText')}</p>
      </>
    )
  }

  return (
    <>
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
