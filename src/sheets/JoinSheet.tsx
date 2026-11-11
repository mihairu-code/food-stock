import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n'
import { parseInviteToken } from '@/lib/invite'
import { Sheet } from './Sheet'

interface JoinSheetProps {
  onJoin: (token: string) => Promise<unknown>
  onClose: () => void
}

/** Вступление в чужой дом по вставленной ссылке — для приложения на экране «Домой», куда ссылку не открыть. */
export function JoinSheet({ onJoin, onClose }: JoinSheetProps) {
  const t = useT()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    const token = parseInviteToken(text)
    if (!token) {
      setError(t('join.notLink'))
      return
    }
    setBusy(true)
    setError(null)
    onJoin(token)
      .then(onClose)
      .catch(() => {
        setError(t('join.invalid'))
        setBusy(false)
      })
  }

  return (
    <Sheet title={t('join.title')} description={t('join.description')} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>{t('invite.title')}</span>
          <input
            value={text}
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="sheet-actions">
          <button className="btn subtle" type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn" type="submit" disabled={!text.trim() || busy}>
            {t('join.submit')}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
