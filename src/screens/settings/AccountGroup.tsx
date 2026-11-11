import { ChevronRight, LogOut, UserRound } from 'lucide-react'
import { useSession } from '@/app/session'
import { useGoogleAvailable, useGoogleSignIn } from '@/data/hooks'
import { useT, type MessageKey } from '@/i18n'

interface AccountGroupProps {
  /** Своё имя в этом доме; пустое — не задано. */
  name: string
  onEditName: () => void
  onJoin: () => void
  onSignOut: () => void
}

/** Аккаунт: вход через Google, своё имя и вступление в другой дом по ссылке. */
export function AccountGroup({ name, onEditName, onJoin, onSignOut }: AccountGroupProps) {
  const t = useT()
  const { user } = useSession()
  const google = useGoogleAvailable()
  const signIn = useGoogleSignIn()

  const hint: MessageKey = !user.isAnonymous
    ? 'settings.accountText'
    : google
      ? 'settings.anonGoogle'
      : 'settings.anonNoGoogle'

  return (
    <>
      <h2 className="group-label">{t('settings.groupAccount')}</h2>
      <div className="card">
        {!user.isAnonymous && (
          <div className="setting-row">
            <span className="row-text">
              <span className="row-name">{user.email}</span>
              <span className="row-meta">{t('settings.googleAccount')}</span>
            </span>
          </div>
        )}
        {user.isAnonymous && google && (
          <button className="setting-row" type="button" disabled={signIn.isPending} onClick={() => signIn.mutate()}>
            <span className="row-text">
              <span className="row-name accent">{t('auth.google')}</span>
              <span className="row-meta">{t('settings.googleMeta')}</span>
            </span>
          </button>
        )}
        <button className="setting-row" type="button" onClick={onEditName}>
          <span className="row-text">
            <span className="row-name">{name || t('settings.setName')}</span>
            <span className="row-meta">{t('settings.nameMeta')}</span>
          </span>
          <UserRound className="chevron" size={18} aria-hidden="true" />
        </button>
        <button className="setting-row" type="button" onClick={onJoin}>
          <span className="row-text">
            <span className="row-name">{t('join.title')}</span>
            <span className="row-meta">{t('settings.joinMeta')}</span>
          </span>
          <ChevronRight className="chevron" size={18} aria-hidden="true" />
        </button>
        {!user.isAnonymous && (
          <button className="setting-row danger" type="button" onClick={onSignOut}>
            <span className="row-text">
              <span className="row-name">{t('settings.signOut')}</span>
            </span>
            <LogOut className="chevron" size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="settings-note">{t(hint)}</p>
    </>
  )
}
