import { useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { useGoogleAvailable, useGoogleSignIn } from '@/features/account'
import { useHomeSearch } from '@/features/home-search'
import {
  accountTipDue,
  crowdedSection,
  MINIMAL_AT,
  oneOffDue,
  QUICK_BUYS_FOR_TIP,
  staleProduct,
  TIPS_FROM_DAY,
  weeksSince,
} from '@/features/tips'
import type { Product, Section } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { setMinimal, useAppearance } from '@/shared/lib/appearance'
import { markCoachSeen, type CoachRequest } from '@/shared/lib/coach/coach'
import { useTipEvents, useTipsEnabled } from '@/shared/lib/coach/tips'
import { useCoach } from '@/shared/lib/coach/useCoach'
import { useDaysSinceStart } from '@/shared/lib/hints/useDaysSinceStart'
import { currentInstallTarget } from '@/shared/lib/install/install'
import { useSession } from '@/shared/session'
import { openSheet } from '@/shared/ui'
import { useProductActions } from './useProductActions'

/** «Не потерять дом» закрыли — вернётся через столько дней, если не нажали «Не напоминать». */
const ACCOUNT_REPEAT_DAYS = 30

interface HomeTipsInput {
  sections: Section[]
  products: Product[]
  loaded: boolean
}

/**
 * Советы на «Доме» (раздел «Советы» в ТЗ обучения: 1, 2, 3+4, 6, 7, 8). Тем же окном, что
 * и подсказки, но не раньше третьего дня, не чаще раза в сутки (решает очередь) и только
 * если советы не выключены в настройках. Подсказки идут первыми: у них номера меньше.
 */
export function useHomeTips({ sections, products, loaded }: HomeTipsInput): void {
  const t = useT()
  const { pathname } = useLocation()
  const search = useHomeSearch()
  const enabled = useTipsEnabled()
  const days = useDaysSinceStart()
  const events = useTipEvents()
  const { minimal } = useAppearance()
  const { user } = useSession()
  const googleAvailable = useGoogleAvailable()
  const { mutate: signIn } = useGoogleSignIn()
  const actions = useProductActions()
  // Сроки советов — дни и недели: время на момент открытия экрана точно хватает.
  const [now] = useState(() => Date.now())

  const ready = enabled && days >= TIPS_FROM_DAY && loaded && pathname === '/' && !search.open
  const count = products.length
  const stale = staleProduct(products, now)
  const crowded = crowdedSection(sections, products)
  const install = currentInstallTarget()
  const appleBrowser = install?.device === 'iphone' || install?.device === 'ipad'
  const accountDue = accountTipDue({
    anonymous: user.isAnonymous,
    googleAvailable,
    appleBrowser,
    opens: events.opens,
    days,
    products: count,
  })
  const accountText = !appleBrowser
    ? t('tip.accountDevice')
    : install?.method === 'ios'
      ? t('tip.accountSafari')
      : t('tip.accountBrowser')

  const oneOff = useMemo<CoachRequest | null>(
    () =>
      ready && oneOffDue(events.oneOffDeletedAt, now)
        ? {
            id: 'tip-one-off',
            order: 101,
            kind: 'tip',
            tap: 'close',
            steps: [{ target: 'tab-shopping', title: t('tip.title'), text: t('tip.oneOff') }],
          }
        : null,
    [ready, events.oneOffDeletedAt, now, t],
  )

  // У каждого давно закончившегося продукта свой совет: «Оставить» про «Кетчуп» не значит,
  // что не нужно спросить про «Горчицу».
  const staleId = stale?.id
  const staleName = stale?.name
  const staleWeeks = stale ? weeksSince(stale.updated_at, now) : 0
  const staleTip = useMemo<CoachRequest | null>(
    () =>
      ready && stale
        ? {
            id: `tip-stale-${staleId}`,
            order: 102,
            kind: 'tip',
            tap: 'close',
            steps: [
              {
                target: `item-${staleId}-row`,
                title: t('tip.title'),
                text: t('tip.stale', { name: staleName ?? '', count: staleWeeks }),
              },
            ],
            actions: [
              { label: t('tip.keep') },
              { label: t('common.delete'), primary: true, run: () => actions.deleteProduct(stale) },
            ],
          }
        : null,
    [ready, stale, staleId, staleName, staleWeeks, actions, t],
  )

  const account = useMemo<CoachRequest | null>(
    () =>
      ready && accountDue
        ? {
            id: 'tip-account',
            order: 103,
            kind: 'tip',
            repeatDays: ACCOUNT_REPEAT_DAYS,
            tap: 'close',
            steps: [{ title: t('tip.title'), text: accountText }],
            actions: [
              { label: t('tip.noRemind'), run: () => markCoachSeen('tip-account') },
              { label: t('auth.google'), primary: true, run: () => signIn() },
            ],
          }
        : null,
    [ready, accountDue, accountText, signIn, t],
  )

  const crowdedId = crowded?.section.id
  const crowdedName = crowded?.section.name
  const crowdedCount = crowded?.count ?? 0
  const crowdedTip = useMemo<CoachRequest | null>(
    () =>
      ready && crowdedId
        ? {
            id: 'tip-crowded',
            order: 106,
            kind: 'tip',
            tap: 'close',
            steps: [
              {
                target: `section-${crowdedId}`,
                title: t('tip.title'),
                text: t('tip.crowded', { name: crowdedName ?? '', count: crowdedCount }),
              },
            ],
            actions: [
              { label: t('common.ok') },
              { label: t('section.newTitle'), primary: true, run: () => openSheet({ type: 'add-section' }) },
            ],
          }
        : null,
    [ready, crowdedId, crowdedName, crowdedCount, t],
  )

  const minimalTip = useMemo<CoachRequest | null>(
    () =>
      ready && count >= MINIMAL_AT && !minimal
        ? {
            id: 'tip-minimal',
            order: 107,
            kind: 'tip',
            tap: 'close',
            steps: [{ title: t('tip.title'), text: t('tip.minimal') }],
            actions: [{ label: t('common.ok') }, { label: t('tip.turnOn'), primary: true, run: () => setMinimal(true) }],
          }
        : null,
    [ready, count, minimal, t],
  )

  const markEarly = useMemo<CoachRequest | null>(
    () =>
      ready && events.quickBuys >= QUICK_BUYS_FOR_TIP
        ? {
            id: 'tip-mark-early',
            order: 108,
            kind: 'tip',
            tap: 'close',
            steps: [{ title: t('tip.title'), text: t('tip.markEarly') }],
          }
        : null,
    [ready, events.quickBuys, t],
  )

  useCoach('tip-one-off', oneOff)
  useCoach(staleTip?.id ?? 'tip-stale', staleTip)
  useCoach('tip-account', account)
  useCoach('tip-crowded', crowdedTip)
  useCoach('tip-minimal', minimalTip)
  useCoach('tip-mark-early', markEarly)
}
