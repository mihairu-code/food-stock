import { useState } from 'react'
import { useJoinHousehold } from '@/entities/household/api/householdApi'
import { parseInviteToken } from '@/entities/invite/lib/inviteToken'
import { useT, type MessageKey } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { useSession } from '@/shared/session/session'
import { TextField } from '@/shared/ui/TextField'
import { FormSheet } from '@/shared/ui/sheet/FormSheet'
import { closeSheet } from '@/shared/ui/sheet/sheetStore'

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
