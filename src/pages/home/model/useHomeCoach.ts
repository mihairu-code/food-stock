import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { stockState } from '@/entities/product'
import { useFirstStepsProgress } from '@/features/first-steps'
import { SEARCH_MIN_PRODUCTS, useHomeSearch } from '@/features/home-search'
import type { Product } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { useAppearance } from '@/shared/lib/appearance'
import type { CoachRequest } from '@/shared/lib/coach/coach'
import { useCoach } from '@/shared/lib/coach/useCoach'
import { useHintsVisible } from '@/shared/lib/hints/useHintsVisible'

/** Окно про свайп — со второго продукта: после первого уже было окно про продукт и плюс. */
const SWIPE_MIN_PRODUCTS = 2
/** Окно про перестановку — с четырёх продуктов: переставлять есть что, и разделов уже несколько. */
const DRAG_MIN_PRODUCTS = 4

interface HomeCoachInput {
  hasSections: boolean
  products: Product[]
  /** Данные загружены: пока идёт загрузка, подсказывать не о чем. */
  loaded: boolean
}

/**
 * Окна подсказок «Дома» (сценарий в ТЗ обучения, окна 2, 3, 5, 6, 9). Повод — состояние
 * дома, а не событие: тот же порядок работает и у человека, которого позвали в заполненный
 * дом. Предлагаются, только пока подсказки видны (новичку — первые дни), открыт «Дом»
 * и не открыт поиск. Когда показать, решает CoachHost.
 */
export function useHomeCoach({ hasSections, products, loaded }: HomeCoachInput): void {
  const t = useT()
  const { pathname } = useLocation()
  const search = useHomeSearch()
  const hints = useHintsVisible()
  const progress = useFirstStepsProgress()
  const { colorSafe } = useAppearance()

  const ready = hints && loaded && pathname === '/' && !search.open
  const count = products.length
  // Окно про продукт и плюс встаёт на продукт, который есть дома и не в покупках: у него плюс.
  const hasPlus = products.some((product) => stockState(product) === 'in')

  const addFirst = useMemo<CoachRequest | null>(
    () =>
      ready && hasSections && count === 0
        ? {
            id: 'add-first',
            order: 2,
            tap: 'press',
            progress,
            steps: [{ target: 'add-product', text: t('coach.addFirst') }],
          }
        : null,
    [ready, hasSections, count, progress, t],
  )

  const productRow = useMemo<CoachRequest | null>(
    () =>
      ready && hasPlus
        ? {
            id: 'product-row',
            order: 3,
            // Касание в вырезе листает шаги, а не нажимает: иначе продукт «закончился» бы,
            // плюс сменился бы минусом, и второй шаг показал бы не то.
            tap: 'next',
            progress,
            steps: [
              { target: 'product-main', title: t('coach.markOutTitle'), text: t('coach.markOut') },
              {
                target: 'product-toggle',
                title: t('coach.plusTitle'),
                text: t(colorSafe ? 'coach.plusSafe' : 'coach.plus'),
              },
            ],
          }
        : null,
    [ready, hasPlus, progress, colorSafe, t],
  )

  const swipe = useMemo<CoachRequest | null>(
    () =>
      ready && hasPlus && count >= SWIPE_MIN_PRODUCTS
        ? {
            id: 'swipe',
            order: 5,
            tap: 'close',
            steps: [{ target: 'product-row', text: t('coach.swipe'), motion: 'jiggle' }],
          }
        : null,
    [ready, hasPlus, count, t],
  )

  const drag = useMemo<CoachRequest | null>(
    () =>
      ready && hasPlus && count >= DRAG_MIN_PRODUCTS
        ? {
            id: 'drag',
            order: 6,
            tap: 'close',
            steps: [{ target: 'product-row', text: t('coach.drag'), motion: 'lift' }],
          }
        : null,
    [ready, hasPlus, count, t],
  )

  const findByName = useMemo<CoachRequest | null>(
    () =>
      ready && count >= SEARCH_MIN_PRODUCTS
        ? {
            id: 'search',
            order: 9,
            tap: 'press',
            steps: [{ target: 'search', text: t('coach.search'), motion: 'shake' }],
          }
        : null,
    [ready, count, t],
  )

  useCoach('add-first', addFirst)
  useCoach('product-row', productRow)
  useCoach('swipe', swipe)
  useCoach('drag', drag)
  useCoach('search', findByName)
}
