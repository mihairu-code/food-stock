import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSession } from '@/app/session'
import { backend } from '@/data'
import { qk } from '@/data/keys'

/** Аккаунт: кто вошёл или предложение войти через Google. */
export function AccountGroup() {
  const { user } = useSession()
  const [busy, setBusy] = useState(false)
  const google = useQuery({
    queryKey: qk.googleAvailable,
    queryFn: () => backend.googleAvailable(),
    staleTime: Infinity,
  })

  function signIn() {
    setBusy(true)
    backend.signInWithGoogle().catch(() => setBusy(false))
  }

  if (user.isAnonymous && !google.data) return null

  return (
    <>
      <h2 className="group-label">Аккаунт</h2>
      <div className="card">
        {user.isAnonymous ? (
          <button className="setting-row" type="button" disabled={busy} onClick={signIn}>
            <span className="row-text">
              <span className="row-name accent">Войти через Google</span>
              <span className="row-meta">Чтобы дом не потерялся при смене телефона</span>
            </span>
          </button>
        ) : (
          <div className="setting-row">
            <span className="row-text">
              <span className="row-name">{user.email}</span>
              <span className="row-meta">Аккаунт Google</span>
            </span>
          </div>
        )}
      </div>
      <p className="settings-note">
        {user.isAnonymous
          ? 'Сейчас вы без аккаунта: дом живёт на этом устройстве.'
          : 'Дом доступен на всех устройствах, где вы вошли через Google.'}
      </p>
    </>
  )
}
