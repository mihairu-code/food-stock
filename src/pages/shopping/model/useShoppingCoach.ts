import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { inviteLink, useCreateInvite } from '@/entities/invite'
import { useMembers } from '@/entities/member'
import { useFirstStepsProgress } from '@/features/first-steps'
import { SHOP_ORDER_AT, TIPS_FROM_DAY } from '@/features/tips'
import { backend } from '@/shared/api'
import { useT } from '@/shared/i18n'
import type { CoachRequest } from '@/shared/lib/coach/coach'
import { markFirstStep, useFirstStepsMarked } from '@/shared/lib/coach/firstSteps'
import { useTipEvents, useTipsEnabled } from '@/shared/lib/coach/tips'
import { useCoach } from '@/shared/lib/coach/useCoach'
import { useDaysSinceStart } from '@/shared/lib/hints/useDaysSinceStart'
import { useHintsVisible } from '@/shared/lib/hints/useHintsVisible'
import { useSession } from '@/shared/session'
import { openSheet } from '@/shared/ui'

/**
 * Окна «Покупок» (окна 7 и 8 и совет 5 в ТЗ обучения): галочка «Купили», после первой
 * покупки — приглашение позвать домашних, а со временем — совет переставить список в
 * порядке магазина. Приглашать может только владелец и не в демо-режиме; окно с
 * приглашением показывается один раз, «Не сейчас» его закрывает насовсем.
 */
export function useShoppingCoach({ entries, loaded }: { entries: number; loaded: boolean }): void {
  const t = useT()
  const { pathname } = useLocation()
  const hints = useHintsVisible()
  const progress = useFirstStepsProgress()
  const steps = useFirstStepsMarked()
  const { role } = useSession()
  const alone = useMembers().data?.length === 1
  const { mutate: createInvite } = useCreateInvite()
  const tipsEnabled = useTipsEnabled()
  const days = useDaysSinceStart()
  const { shoppingReordered } = useTipEvents()

  const ready = hints && loaded && pathname === '/shopping'
  const canInvite = backend.mode !== 'local' && role === 'owner' && alone
  const bought = steps.has('bought')
  const hasEntries = entries > 0
  const tipsReady = tipsEnabled && days >= TIPS_FROM_DAY && loaded && pathname === '/shopping'

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
            tap: 'none',
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

  const shopOrder = useMemo<CoachRequest | null>(
    () =>
      tipsReady && entries >= SHOP_ORDER_AT && !shoppingReordered
        ? {
            id: 'tip-shop-order',
            order: 105,
            kind: 'tip',
            tap: 'none',
            steps: [{ target: 'shopping-list', title: t('tip.title'), text: t('tip.shopOrder') }],
          }
        : null,
    [tipsReady, entries, shoppingReordered, t],
  )

  useCoach('buy', buy)
  useCoach('invite', invite)
  useCoach('tip-shop-order', shopOrder)
}
