import { useState } from 'react'
import { useT } from '@/i18n'
import { signInWithGoogle } from './googleSignIn'

/** Первое знакомство: войти через Google или начать без аккаунта. */
export function Welcome({ onContinue }: { onContinue: () => void }) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  function signIn() {
    setBusy(true)
    setFailed(false)
    // Пользователя на устройстве ещё нет — переносить нечего, билет не нужен.
    signInWithGoogle(null).catch(() => {
      setBusy(false)
      setFailed(true)
    })
  }

  return (
    <main className="auth">
      <div className="auth-emoji" aria-hidden="true">
        🏠
      </div>
      <h1>{t('app.name')}</h1>
      <p className="auth-lead">{t('app.tagline')}</p>
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
      {failed && <p className="field-error">{t('toast.googleError')}</p>}
    </main>
  )
}
