import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router'
import { useHomeSearch } from '@/features/home-search'
import type { Product, Section } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { useAppearance } from '@/shared/lib/appearance'
import type { CoachRequest } from '@/shared/lib/coach/coach'
import { completeTourStep, TOUR_STEPS, useTourStep } from '@/shared/lib/coach/tour'
import { useCoach } from '@/shared/lib/coach/useCoach'

interface HomeCoachInput {
  sections: Section[]
  products: Product[]
  /** Данные загружены: пока идёт загрузка, подсказывать не о чем. */
  loaded: boolean
}

/** Самый новый продукт: обучение показывает на нём то, что человек только что добавил. */
const newest = (products: readonly Product[]) =>
  products.reduce<Product | undefined>(
    (latest, product) => (!latest || product.created_at > latest.created_at ? product : latest),
    undefined,
  )

/**
 * Шаги обучения на «Доме» (ТЗ обучения: шаги 1, 2, 4, 5; шаг 3 — в «Покупках»). Обучение
 * идёт подряд: окно шага предлагается, только когда предыдущие пройдены, и закрытие окна
 * двигает обучение дальше. Когда показать, решает CoachHost.
 */
export function useHomeCoach({ sections, products, loaded }: HomeCoachInput): void {
  const t = useT()
  const { pathname } = useLocation()
  const search = useHomeSearch()
  const { colorSafe } = useAppearance()
  const step = useTourStep()

  const onHome = loaded && pathname === '/' && !search.open
  const count = products.length
  const progress = t('coach.tourProgress', { step, total: TOUR_STEPS })
  // На продукте с плюсом (не в покупках) — свежем, который человек только что добавил.
  const plusId = newest(products.filter((product) => !product.to_buy))?.id
  const rowId = newest(products)?.id
  const firstSectionId = sections[0]?.id

  // У того, у кого продукты уже есть (пользуется приложением давно), шаг «добавьте
  // продукт» засчитывается сам: учить там нечему.
  useEffect(() => {
    if (loaded && step === 1 && count > 0) completeTourStep(1)
  }, [loaded, step, count])

  const addFirst = useMemo<CoachRequest | null>(
    () =>
      onHome && step === 1 && firstSectionId && count === 0
        ? {
            id: 'tour-1',
            kind: 'tour',
            order: 1,
            tap: 'press',
            progress,
            steps: [{ target: 'add-product', text: t('coach.addFirst') }],
            onDone: () => completeTourStep(1),
          }
        : null,
    [onHome, step, firstSectionId, count, progress, t],
  )

  const product = useMemo<CoachRequest | null>(
    () =>
      onHome && step === 2 && plusId
        ? {
            id: 'tour-2',
            kind: 'tour',
            order: 2,
            // Продукт и плюс касание в вырезе только листает: иначе продукт «закончился» бы,
            // плюс сменился бы минусом, и второй шаг показал бы не то. Вкладку — нажимает.
            tap: 'next',
            progress,
            steps: [
              { target: `item-${plusId}-main`, title: t('coach.markOutTitle'), text: t('coach.markOut') },
              {
                target: `item-${plusId}-toggle`,
                title: t('coach.plusTitle'),
                text: t(colorSafe ? 'coach.plusSafe' : 'coach.plus'),
              },
              { target: 'tab-shopping', text: t('coach.shoppingTab'), tap: 'press' },
            ],
            onDone: () => completeTourStep(2),
          }
        : null,
    [onHome, step, plusId, colorSafe, progress, t],
  )

  const swipe = useMemo<CoachRequest | null>(
    () =>
      onHome && step === 4 && rowId
        ? {
            id: 'tour-4',
            kind: 'tour',
            order: 4,
            tap: 'none',
            progress,
            steps: [{ target: `item-${rowId}-row`, text: t('coach.swipe'), motion: 'jiggle' }],
            onDone: () => completeTourStep(4),
          }
        : null,
    [onHome, step, rowId, progress, t],
  )

  const sectionsStep = useMemo<CoachRequest | null>(
    () =>
      onHome && step === 5 && firstSectionId
        ? {
            id: 'tour-5',
            kind: 'tour',
            order: 5,
            tap: 'next',
            progress,
            steps: [
              { target: 'new-section', text: t('coach.newSection') },
              { target: `section-edit-${firstSectionId}`, text: t('coach.editSection') },
            ],
            onDone: () => completeTourStep(5),
          }
        : null,
    [onHome, step, firstSectionId, progress, t],
  )

  useCoach('tour-1', addFirst)
  useCoach('tour-2', product)
  useCoach('tour-4', swipe)
  useCoach('tour-5', sectionsStep)
}
