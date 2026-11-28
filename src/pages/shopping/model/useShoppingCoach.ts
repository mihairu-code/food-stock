import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { SHOP_ORDER_AT, TIPS_FROM_DAY } from '@/features/tips'
import { useT } from '@/shared/i18n'
import type { CoachRequest } from '@/shared/lib/coach/coach'
import { useTipEvents, useTipsEnabled } from '@/shared/lib/coach/tips'
import { completeTourStep, TOUR_DONE, TOUR_STEPS, useTourStep } from '@/shared/lib/coach/tour'
import { useCoach } from '@/shared/lib/coach/useCoach'
import { useDaysSinceStart } from '@/shared/lib/hints/useDaysSinceStart'

/**
 * Окна «Покупок»: шаг 3 обучения (галочка «Купили», потом «Добавить» прямо в покупках) и,
 * после обучения, совет переставить список в порядке магазина. Шаг 3 ждёт, пока в покупках
 * что-то появится и человек их откроет: дальше обучение не идёт.
 */
export function useShoppingCoach({ entries, loaded }: { entries: number; loaded: boolean }): void {
  const t = useT()
  const { pathname } = useLocation()
  const step = useTourStep()
  const tipsEnabled = useTipsEnabled()
  const days = useDaysSinceStart()
  const { shoppingReordered } = useTipEvents()

  const onShopping = loaded && pathname === '/shopping'
  const tipsReady = tipsEnabled && step === TOUR_DONE && days >= TIPS_FROM_DAY && onShopping

  const tour = useMemo<CoachRequest | null>(
    () =>
      onShopping && step === 3 && entries > 0
        ? {
            id: 'tour-3',
            kind: 'tour',
            order: 3,
            tap: 'next',
            progress: t('coach.tourProgress', { step, total: TOUR_STEPS }),
            steps: [
              { target: 'shopping-toggle', text: t('coach.buy') },
              { target: 'shopping-add', text: t('coach.shoppingAdd') },
            ],
            onDone: () => completeTourStep(3),
          }
        : null,
    [onShopping, step, entries, t],
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

  useCoach('tour-3', tour)
  useCoach('tip-shop-order', shopOrder)
}
