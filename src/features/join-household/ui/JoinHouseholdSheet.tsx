import { useState } from 'react'
import { parseInviteToken, useJoinHousehold } from '@/entities/invite'
import { useT, type MessageKey } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { useSession } from '@/shared/session'
import { closeSheet, FormSheet, TextField } from '@/shared/ui'

/** Вступление в чужой дом по вставленной ссылке — для приложения на экране «Домой», куда ссылку не открыть. */
export function JoinHouseholdSheet() {
  const t = useT()
  const { selectHousehold } = useSession()
  const join = useJoinHousehold()
  const [text, setText] = useState('')
  const [error, setError] = useState<MessageKey | null>(null)

  function changeText(next: string) {
    setText(next)
    setError(null)
  }

  function joinByLink() {
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
      onSubmit={joinByLink}
    >
      <TextField
        id="join-link"
        label={t('invite.title')}
        value={text}
        onChange={changeText}
        autoFocus
        autoCapitalize="none"
        spellCheck={false}
        error={error && t(error)}
      />
    </FormSheet>
  )
}
