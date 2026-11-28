import { useEffect, useState } from 'react'
import {
  finishCoach,
  nextCoach,
  startCoach,
  useActiveCoach,
  useCoachCandidates,
  useCoachSeen,
} from '@/shared/lib/coach/coach'
import { useToastMessage } from '@/shared/lib/toast'
import { useActiveSheet } from '../sheet'
import { CoachWindow } from './CoachWindow'

/** Экран успокоился (закрылась шторка, ушёл тост) — окно ждёт ещё столько, чтобы не выскочить вдогонку. */
const SETTLE_MS = 600
const MAX_WAIT_MS = 60 * 60 * 1000

/**
 * Место для окон подсказок и советов. Монтируется один раз в каркасе приложения. Окно
 * открывается только на спокойном экране: без шторки, без тоста с «Вернуть» (окно закрыло
 * бы его кнопку), без экранной клавиатуры и не посреди перетаскивания. Поиск экран
 * исключает сам: пока он открыт, окон не предлагает.
 */
export function CoachHost() {
  const candidates = useCoachCandidates()
  const seen = useCoachSeen()
  const active = useActiveCoach()
  const sheet = useActiveSheet()
  const toast = useToastMessage()
  // Повод проверить очередь ещё раз, когда в прошлый раз помешала клавиатура или пауза.
  const [attempt, setAttempt] = useState(0)
  const calm = !sheet && !toast?.action

  useEffect(() => {
    if (active || !calm || candidates.length === 0) return
    const { candidate, retryAt } = nextCoach()
    if (!candidate && retryAt === null) return
    // Ждать советам бывает и сутки, и месяц, а таймер браузера дольше ~24 дней не держит:
    // проверяем хотя бы раз в час, очередь сама скажет, рано ли ещё.
    const delay = candidate ? SETTLE_MS : Math.min(MAX_WAIT_MS, Math.max(SETTLE_MS, retryAt! - Date.now()))
    const timer = window.setTimeout(() => {
      // Пока открыта клавиатура или строку несут пальцем, окно подождёт.
      const busy =
        document.documentElement.hasAttribute('data-keyboard') || document.querySelector("[data-dragging='true']") !== null
      const pick = busy ? null : nextCoach().candidate
      if (pick) startCoach(pick.request)
      else setAttempt((count) => count + 1)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [active, calm, candidates, seen, attempt])

  // Повод пропал, пока окно открыто (продукт удалили на другом телефоне): закрываем молча,
  // при новом поводе окно покажется снова.
  const withdrawn = active !== null && !candidates.some((candidate) => candidate.request.id === active.id)
  useEffect(() => {
    if (withdrawn) finishCoach(active.id, { seen: false })
  }, [withdrawn, active])

  return active && !withdrawn ? <CoachWindow key={active.id} request={active} /> : null
}
