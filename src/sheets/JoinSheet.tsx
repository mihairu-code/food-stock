import { useState } from 'react'
import { useSession } from '@/app/session'
import { TextField } from '@/components'
import { useJoinHousehold } from '@/data/hooks'
import { useT, type MessageKey } from '@/i18n'
import { parseInviteToken } from '@/lib/invite'
import { notify } from '@/lib/toast'
import { FormSheet } from './FormSheet'
import { closeSheet } from './sheetStore'

/** Вступление в чужой дом по вставленной ссылке — для приложения на экране «Домой», куда ссылку не открыть. */
export function JoinSheet() {
  const t = useT()
  const { selectHousehold } = useSession()
  const join = useJoinHousehold()
  const [text, setText] = useState('')
  const [error, setError] = useState<MessageKey | null>(null)

  function submit() {
    const token = parseInviteToken(text)
    if (!token) {
      setError('join.notLink')
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
      onError: () => setError('join.invalid'),
    })
  }

  return (
    <FormSheet
      title={t('join.title')}
      description={t('join.description')}
      submitLabel={t('join.submit')}
      disabled={!text.trim() || join.isPending}
      onSubmit={submit}
    >
      <TextField
        id="join-link"
        label={t('invite.title')}
        value={text}
        onChange={setText}
        autoFocus
        autoCapitalize="none"
        spellCheck={false}
        aria-describedby={error ? 'join-error' : undefined}
      />
      {error && (
        <p className="field-error" id="join-error" role="alert">
          {t(error)}
        </p>
      )}
    </FormSheet>
  )
}
