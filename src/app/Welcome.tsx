import { useState } from 'react'
import { backend } from '@/data'
import { useT } from '@/i18n'
import { rememberInviteToken } from '@/lib/invite'
import { notify } from '@/lib/toast'

interface WelcomeProps {
  invited: boolean
  onContinue: () => void
}

/** Первое знакомство: войти через Google или начать без аккаунта. */
export function Welcome({ invited, onContinue }: WelcomeProps) {
  const t = useT()
  const [busy, setBusy] = useState(false)

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
    </main>
  )
}
