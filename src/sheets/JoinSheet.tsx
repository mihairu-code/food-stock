import { useState, type FormEvent } from 'react'
import { useSession } from '@/app/session'
import { TextField } from '@/components'
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
        <TextField
          id="join-link"
          label={t('invite.title')}
          value={text}
          onChange={setText}
          autoFocus
          autoCapitalize="none"
          spellCheck={false}
        />
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
