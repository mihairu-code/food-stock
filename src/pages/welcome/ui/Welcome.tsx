import { useState } from 'react'
import { rememberInviteToken } from '@/entities/invite/lib/inviteToken'
import { backend } from '@/shared/api/currentBackend'
import { useT } from '@/shared/i18n'
import { currentInstallTarget, type InstallTarget } from '@/shared/lib/install/install'
import { notify } from '@/shared/lib/toast'
import { InstallCard } from './InstallCard'

interface WelcomeProps {
  invited: boolean
  onContinue: () => void
  /** Под какое устройство показать установку; по умолчанию — под это. null — не показывать. */
  install?: InstallTarget | null
}

/** Первое знакомство: войти через Google или начать без аккаунта, а заодно — поставить приложение. */
export function Welcome({ invited, onContinue, install: installOverride }: WelcomeProps) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [deviceInstall] = useState(currentInstallTarget)
  const install = installOverride === undefined ? deviceInstall : installOverride

  function signIn() {
    setBusy(true)
    // Приглашение из адреса должно пережить уход на страницу Google.
    rememberInviteToken()
    backend.signInWithGoogle().catch(() => {
      setBusy(false)
      notify('toast.googleError')
    })
  }

  return (
    <main className="auth">
      <div className="auth-emoji" aria-hidden="true">🏠</div>
      <h1>{t('app.name')}</h1>
      <p className="auth-lead">{t(invited ? 'welcome.invited' : 'app.tagline')}</p>
      <div className="card welcome-card">
        <button className="btn" type="button" disabled={busy} onClick={signIn}>
          {t('auth.google')}
        </button>
        <p className="welcome-note">{t('welcome.googleNote')}</p>
        <button className="btn subtle" type="button" disabled={busy} onClick={onContinue}>
          {t('welcome.anon')}
        </button>
        <p className="welcome-note">{t('welcome.later')}</p>
      </div>
      {install && <InstallCard target={install} />}
    </main>
  )
}
