import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import { queryClient } from '@/data/queryClient'

/** Первый вход: принять приглашение в чужой дом или завести свой. */
export function CreateHousehold() {
  const invites = useQuery({ queryKey: qk.myInvites, queryFn: () => backend.listMyInvites() })
  const [name, setName] = useState('Мой дом')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await queryClient.invalidateQueries({ queryKey: qk.memberships })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setBusy(false)
    }
  }

  function create(event: FormEvent) {
    event.preventDefault()
    void run(() => backend.createHousehold(name.trim()))
  }

  return (
    <main className="auth">
      <h1>Ваш дом</h1>

      {invites.data && invites.data.length > 0 && (
        <>
          <p className="auth-lead">Вас пригласили:</p>
          <div className="card">
            {invites.data.map((invite) => (
              <div className="setting-row" key={invite.id}>
                <span className="row-text">
                  <span className="row-name">{invite.household_name}</span>
                  {invite.invited_by_email && <span className="row-meta">от {invite.invited_by_email}</span>}
                </span>
                <button
                  className="btn small"
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => backend.acceptInvite(invite.id))}
                >
                  Вступить
                </button>
              </div>
            ))}
          </div>
          <p className="auth-lead">Или заведите свой:</p>
        </>
      )}

      <form onSubmit={create}>
        <label className="field">
          <span>Название дома</span>
          <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
        <button className="btn wide" type="submit" disabled={busy || !name.trim()}>
          Создать дом
        </button>
      </form>
      {error && <p className="field-error">{error}</p>}
    </main>
  )
}
