import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { rememberHousehold } from '@/entities/household'
import { MergeChoicePage } from '@/pages/merge-choice'
import { backend, queryClient, type MergeKeep, type MergePreview, type User } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { clearMergeTicket, readMergeTicket } from '@/shared/lib/mergeTicket'
import { notify } from '@/shared/lib/toast'
import { Notice, StatusNote } from '@/shared/ui'

type MergeState =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'choice'; ticket: string; preview: MergePreview }
  | { status: 'failed' }

function initialState(user: User): MergeState {
  const ticket = readMergeTicket()
  if (!ticket) return { status: 'idle' }
  // Вход не состоялся (человек вернулся без аккаунта) — билет больше не нужен.
  if (user.isAnonymous || ticket.userId === user.id) {
    clearMergeTicket()
    return { status: 'idle' }
  }
  return { status: 'working' }
}

/**
 * Человек вошёл через Google на устройстве, где уже пользовался приложением без
 * аккаунта. Его прежний анонимный пользователь вливается в аккаунт: дома переходят
 * к аккаунту, дубль удаляется. Если и там, и там есть свои дома с данными —
 * спрашиваем, какие оставить.
 */
export function MergeGate({ user, children }: { user: User; children: ReactNode }) {
  const t = useT()
  const [state, setState] = useState(() => initialState(user))
  const started = useRef(false)

  const finishMerge = useCallback(async (householdId: string | null) => {
    clearMergeTicket()
    if (householdId) rememberHousehold(householdId)
    await queryClient.invalidateQueries()
    setState({ status: 'idle' })
  }, [])

  const showMergeError = useCallback(() => setState({ status: 'failed' }), [])

  useEffect(() => {
    const ticket = readMergeTicket()
    if (state.status !== 'working' || started.current || !ticket) return
    started.current = true
    backend
      .previewMerge(ticket.token)
      .then(async (preview) => {
        if (preview.needs_choice) {
          setState({ status: 'choice', ticket: ticket.token, preview })
          return
        }
        await finishMerge(await backend.completeMerge(ticket.token, null))
        notify('merge.done')
      })
      .catch(showMergeError)
  }, [state.status, finishMerge, showMergeError])

  function keepChosenHomes(ticket: string, keep: MergeKeep) {
    setState({ status: 'working' })
    backend.completeMerge(ticket, keep).then(finishMerge).catch(showMergeError)
  }

  if (state.status === 'idle') return children
  if (state.status === 'working') return <StatusNote fullscreen loading="fridge">{t('merge.working')}</StatusNote>
  if (state.status === 'failed') {
    return (
      <Notice
        title={t('merge.failedTitle')}
        actionLabel={t('common.continue')}
        onAction={() => {
          clearMergeTicket()
          setState({ status: 'idle' })
        }}
      >
        {t('merge.failedText')}
      </Notice>
    )
  }

  const { ticket, preview } = state
  return <MergeChoicePage email={user.email ?? ''} preview={preview} onChoose={(keep) => keepChosenHomes(ticket, keep)} />
}
