import { useQuery } from '@tanstack/react-query'
import { ChevronRight, UserRound } from 'lucide-react'
import { useState } from 'react'
import { signInWithGoogle } from '@/app/googleSignIn'
import { useSession } from '@/app/session'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import { useT, type MessageKey } from '@/i18n'

interface AccountGroupProps {
  /** Своё имя в этом доме; пустое — не задано. */
  name: string
  onEditName: () => void
  onJoin: () => void
}

/** Аккаунт: вход через Google, своё имя и вступление в другой дом по ссылке. */
export function AccountGroup({ name, onEditName, onJoin }: AccountGroupProps) {
  const t = useT()
  const toast = useToast()
  const { user } = useSession()
  const [busy, setBusy] = useState(false)
  const google = useQuery({
    queryKey: qk.googleAvailable,
    queryFn: () => backend.googleAvailable(),
    staleTime: Infinity,
  }).data

  function signIn() {
    setBusy(true)
    signInWithGoogle(user.id).catch(() => {
      setBusy(false)
      toast(t('toast.googleError'))
    })
  }

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
          <button className="setting-row" type="button" disabled={busy} onClick={signIn}>
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
      </div>
      <p className="settings-note">{t(hint)}</p>
    </>
  )
}
