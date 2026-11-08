import { useState, type FormEvent } from 'react'
import { backend } from '@/data'

/** Вход по одноразовому коду из письма: без паролей. */
export function SignIn() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  function sendCode(event: FormEvent) {
    event.preventDefault()
    void run(async () => {
      await backend.sendEmailCode(email.trim())
      setStep('code')
    })
  }

  function verify(event: FormEvent) {
    event.preventDefault()
    // После входа onAuthChange перечитает пользователя, и экран сменится сам.
    void run(() => backend.verifyEmailCode(email.trim(), code.trim()))
  }

  return (
    <main className="auth">
      <h1>Домашние запасы</h1>
      <p className="auth-lead">Общий список того, что есть дома, и того, что надо купить.</p>

      {step === 'email' ? (
        <form onSubmit={sendCode}>
          <label className="field">
            <span>Почта</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="btn wide" type="submit" disabled={busy || !email.trim()}>
            Получить код
          </button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p className="auth-lead">Отправили код на {email}. Введите его здесь.</p>
          <label className="field">
            <span>Код из письма</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
          </label>
          <button className="btn wide" type="submit" disabled={busy || !code.trim()}>
            Войти
          </button>
          <button className="btn wide subtle" type="button" onClick={() => setStep('email')}>
            Другая почта
          </button>
        </form>
      )}
      {error && <p className="field-error">{error}</p>}
    </main>
  )
}
