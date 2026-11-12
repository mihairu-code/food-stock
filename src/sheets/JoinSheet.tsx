import { useState, type FormEvent } from 'react'
import { useSession } from '@/app/session'
import { useJoinHousehold } from '@/data/hooks'
import { useT } from '@/i18n'
import { parseInviteToken } from '@/lib/invite'
import { notify } from '@/lib/toast'
import { Sheet } from './Sheet'
import { SheetActions } from './SheetActions'
import { closeSheet } from './sheetStore'

/** Вступление в чужой дом по вставленной ссылке — для приложения на экране «Домой», куда ссылку не открыть. */
export function JoinSheet() {
  const t = useT()
  const { selectHousehold } = useSession()
  const join = useJoinHousehold()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    const token = parseInviteToken(text)
    if (!token) {
      setError(t('join.notLink'))
      return
    }
    setError(null)
    join.mutate(token, {
      // К этому моменту список домов уже перечитан.
      onSuccess: (householdId) => {
        selectHousehold(householdId)
        closeSheet()
        notify('toast.joined')
      },
      onError: () => setError(t('join.invalid')),
    })
  }

  return (
    <Sheet title={t('join.title')} description={t('join.description')}>
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
        <SheetActions submitLabel={t('join.submit')} disabled={!text.trim() || join.isPending} />
      </form>
    </Sheet>
  )
}
