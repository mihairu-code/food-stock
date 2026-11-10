import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import { queryClient } from '@/data/queryClient'
import type { MergeKeep, MergePreview, User } from '@/domain/types'
import { rememberHousehold } from '@/lib/household'
import { clearMergeTicket, readMergeTicket } from '@/lib/mergeTicket'
import { MergeChoice } from './MergeChoice'

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
  const toast = useToast()
  const [state, setState] = useState(() => initialState(user))
  const started = useRef(false)

  const finish = useCallback(async (householdId: string | null) => {
    clearMergeTicket()
    if (householdId) rememberHousehold(householdId)
    await queryClient.invalidateQueries()
    setState({ status: 'idle' })
  }, [])

  const fail = useCallback(() => setState({ status: 'failed' }), [])

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
        await finish(await backend.completeMerge(ticket.token, null))
        toast('Готово: всё с этого устройства теперь в аккаунте')
      })
      .catch(fail)
  }, [state.status, finish, fail, toast])

  function choose(ticket: string, keep: MergeKeep) {
    setState({ status: 'working' })
    backend.completeMerge(ticket, keep).then(finish).catch(fail)
  }

  if (state.status === 'idle') return children
  if (state.status === 'working') return <p className="status">Переносим данные в аккаунт…</p>
  if (state.status === 'failed') {
    return (
      <div className="notice">
        <h2>Не удалось перенести данные</h2>
        <p>Вы вошли в аккаунт, но дом с этого устройства в него не попал. Его можно позвать ссылкой.</p>
        <button
          className="btn"
          type="button"
          onClick={() => {
            clearMergeTicket()
            setState({ status: 'idle' })
          }}
        >
          Продолжить
        </button>
      </div>
    )
  }

  const { ticket, preview } = state
  return <MergeChoice email={user.email ?? ''} preview={preview} onChoose={(keep) => choose(ticket, keep)} />
}
