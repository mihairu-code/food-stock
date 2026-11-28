import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { inviteLink, useCreateInvite } from '@/entities/invite'
import { useMembers } from '@/entities/member'
import { useFirstStepsProgress } from '@/features/first-steps'
import { backend } from '@/shared/api'
import { useT } from '@/shared/i18n'
import type { CoachRequest } from '@/shared/lib/coach/coach'
import { markFirstStep, useFirstStepsMarked } from '@/shared/lib/coach/firstSteps'
import { useCoach } from '@/shared/lib/coach/useCoach'
import { useHintsVisible } from '@/shared/lib/hints/useHintsVisible'
import { useSession } from '@/shared/session'
import { openSheet } from '@/shared/ui'

/**
 * Окна подсказок «Покупок» (окна 7 и 8 в ТЗ обучения): галочка «Купили» и, после первой
 * покупки, приглашение позвать домашних. Приглашать может только владелец и не в демо-режиме;
 * окно с приглашением показывается один раз, «Не сейчас» его закрывает насовсем.
 */
export function useShoppingCoach({ hasEntries, loaded }: { hasEntries: boolean; loaded: boolean }): void {
  const t = useT()
  const { pathname } = useLocation()
  const hints = useHintsVisible()
  const progress = useFirstStepsProgress()
  const steps = useFirstStepsMarked()
  const { role } = useSession()
  const alone = useMembers().data?.length === 1
  const { mutate: createInvite } = useCreateInvite()

  const ready = hints && loaded && pathname === '/shopping'
  const canInvite = backend.mode !== 'local' && role === 'owner' && alone
  const bought = steps.has('bought')

  const buy = useMemo<CoachRequest | null>(
    () =>
      ready && hasEntries
        ? {
            id: 'buy',
            order: 7,
            tap: 'press',
            progress,
            steps: [{ target: 'shopping-toggle', text: t('coach.buy') }],
          }
        : null,
    [ready, hasEntries, progress, t],
  )

  const invite = useMemo<CoachRequest | null>(
    () =>
      ready && canInvite && bought
        ? {
            id: 'invite',
            order: 8,
            tap: 'close',
            progress,
            steps: [{ title: t('coach.inviteTitle'), text: t('coach.invite') }],
            actions: [
              { label: t('coach.later') },
              {
                label: t('coach.inviteAction'),
                primary: true,
                run: () =>
                  createInvite(undefined, {
                    onSuccess: (token) => {
                      markFirstStep('invited')
                      openSheet({ type: 'invite-link', link: inviteLink(token) })
                    },
                  }),
              },
            ],
          }
        : null,
    [ready, canInvite, bought, progress, createInvite, t],
  )

  useCoach('buy', buy)
  useCoach('invite', invite)
}
