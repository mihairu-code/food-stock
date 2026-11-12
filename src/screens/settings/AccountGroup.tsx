import { useSession } from '@/app/session'
import { SettingRow, SettingsGroup } from '@/components'
import { useGoogleAvailable, useGoogleSignIn, useMembers } from '@/data/hooks'
import { useT, type MessageKey } from '@/i18n'
import { savedName } from '@/lib/invite'
import { openSheet } from '@/sheets'

/** Аккаунт: вход через Google, своё имя и вступление в другой дом по ссылке. */
export function AccountGroup() {
  const t = useT()
  const { user } = useSession()
  const google = useGoogleAvailable()
  const signIn = useGoogleSignIn()
  const me = useMembers().data?.find((member) => member.user_id === user.id)

  const hint: MessageKey = !user.isAnonymous
    ? 'settings.accountText'
    : google
      ? 'settings.anonGoogle'
      : 'settings.anonNoGoogle'

  return (
    <>
      <SettingsGroup label={t('settings.groupAccount')}>
        {!user.isAnonymous && <SettingRow title={user.email} meta={t('settings.googleAccount')} />}
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
      <p className="settings-note">{t(hint)}</p>
    </>
  )
}
