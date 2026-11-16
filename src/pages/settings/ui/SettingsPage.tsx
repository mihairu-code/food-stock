import { LogOut } from 'lucide-react'
import { useResetLocalData, useSignOut } from '@/features/account'
import { backend } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session'
import { Hint, openSheet, SettingRow, SettingsGroup } from '@/shared/ui'
import { AccountGroup } from './AccountGroup'
import { AppGroup } from './AppGroup'
import { HomeGroup } from './HomeGroup'
import { MembersGroup } from './MembersGroup'

export function SettingsPage() {
  const t = useT()
  const { user } = useSession()
  const signOut = useSignOut()
  const resetDemo = useResetLocalData()

  const confirmReset = () =>
    openSheet({
      type: 'confirm',
      title: t('confirm.resetTitle'),
      description: t('confirm.resetText'),
      confirmLabel: t('confirm.reset'),
      onConfirm: () => resetDemo.mutate(),
    })

  const confirmSignOut = () =>
    openSheet({
      type: 'confirm',
      title: t('confirm.signOutTitle'),
      description: t('confirm.signOutText'),
      confirmLabel: t('confirm.signOut'),
      onConfirm: () => signOut.mutate(),
    })

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
            onClick={confirmReset}
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
        <button className="btn subtle sign-out" type="button" onClick={confirmSignOut}>
          <LogOut size={16} aria-hidden="true" /> {t('settings.signOut')}
        </button>
      )}
    </>
  )
}
