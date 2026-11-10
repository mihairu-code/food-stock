import { useState } from 'react'
import { backend } from '@/data'

/** Первое знакомство: войти через Google или начать без аккаунта. */
export function Welcome({ onContinue }: { onContinue: () => void }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  function signIn() {
    setBusy(true)
    setFailed(false)
    backend.signInWithGoogle().catch(() => {
      setBusy(false)
      setFailed(true)
    })
  }

  return (
    <main className="auth">
      <div className="auth-emoji" aria-hidden="true">
        🏠
      </div>
      <h1>Домашние запасы</h1>
      <p className="auth-lead">Общий список того, что есть дома, и того, что надо купить.</p>
      <div className="card welcome-card">
        <button className="btn" type="button" disabled={busy} onClick={signIn}>
          Войти через Google
        </button>
        <p className="welcome-note">Данные не потеряются при смене телефона, дом будет на всех ваших устройствах.</p>
        <button className="btn subtle" type="button" disabled={busy} onClick={onContinue}>
          Продолжить без аккаунта
        </button>
        <p className="welcome-note">Войти можно и потом, в настройках, — всё созданное сохранится.</p>
      </div>
      {failed && <p className="field-error">Не удалось открыть вход через Google. Попробуйте ещё раз.</p>}
    </main>
  )
}
