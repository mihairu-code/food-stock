import { useMembers } from '@/entities/member'
import { useGoogleAvailable, useGoogleSignIn } from '@/features/account'
import { useHomeData } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { currentInstallTarget } from '@/shared/lib/install/install'
import { savedName } from '@/shared/lib/userName'
import { useSession } from '@/shared/session'
import { openSheet, SettingRow, SettingsGroup } from '@/shared/ui'

/** Аккаунт: вход через Google, своё имя и вступление в другой дом по ссылке. */
export function AccountGroup() {
  const t = useT()
  const { user } = useSession()
  const google = useGoogleAvailable()
  const signIn = useGoogleSignIn()
  const me = useMembers().data?.find((member) => member.user_id === user.id)
  const { products } = useHomeData()
  // На iPhone и iPad у приложения с экрана «Домой» своё хранилище (docs/ru/ios-notes.md):
  // поставленное без аккаунта, оно откроется с новым пустым домом, а этот останется в браузере.
  // Пока продуктов нет, терять нечего. В установленном приложении target — null.
  const target = currentInstallTarget()
  const appleBrowser = target?.device === 'iphone' || target?.device === 'ipad'
  const warnBeforeInstall = user.isAnonymous && google && appleBrowser && products.length > 0

  return (
    <SettingsGroup label={t('settings.groupAccount')}>
      {!user.isAnonymous && <SettingRow title={user.email} meta={t('settings.googleAccount')} />}
      {warnBeforeInstall && (
        <SettingRow
          title={t(target.method === 'ios' ? 'settings.beforeInstallSafari' : 'settings.beforeInstallBrowser')}
          meta={t('settings.beforeInstallMeta')}
        />
      )}
      {user.isAnonymous && google && (
        <SettingRow
          title={t('auth.google')}
          meta={t('settings.googleMeta')}
          disabled={signIn.isPending}
          onClick={() => signIn.mutate()}
        />
      )}
      <SettingRow
        title={me?.display_name || t('settings.setName')}
        meta={t('settings.nameMeta')}
        onClick={() => openSheet({ type: 'my-name', current: me?.display_name ?? savedName() })}
      />
      <SettingRow
        title={t('join.title')}
        meta={t('settings.joinMeta')}
        onClick={() => openSheet({ type: 'join' })}
      />
    </SettingsGroup>
  )
}
