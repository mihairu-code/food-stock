import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { inviteLink, useCreateInvite } from '@/entities/invite'
import { useMembers } from '@/entities/member'
import { SEARCH_MIN_PRODUCTS, useHomeSearch } from '@/features/home-search'
import { backend, type Product, type Section } from '@/shared/api'
import { useT } from '@/shared/i18n'
import type { CoachRequest } from '@/shared/lib/coach/coach'
import { useTipsEnabled } from '@/shared/lib/coach/tips'
import { TOUR_DONE, useTourStep } from '@/shared/lib/coach/tour'
import { useCoach } from '@/shared/lib/coach/useCoach'
import { useSession } from '@/shared/session'
import { openSheet } from '@/shared/ui'

/** Совет переставлять продукты — с трёх продуктов: переставлять уже есть что. */
const DRAG_PRODUCTS_AT = 3
/** Совет переставлять разделы — с трёх разделов. */
const DRAG_SECTIONS_AT = 3

interface FeatureTipsInput {
  sections: Section[]
  products: Product[]
  loaded: boolean
}

/**
 * Советы по функциям, которых нет в обучении (ТЗ обучения, «Советы по функциям»):
 * перестановка продуктов и разделов, поиск и приглашение. Только после обучения и под
 * переключателем «Советы». Приглашение — сразу после обучения; остальные — как только
 * появился повод, но не чаще окна в минуту (вид `feature`).
 */
export function useFeatureTips({ sections, products, loaded }: FeatureTipsInput): void {
  const t = useT()
  const { pathname } = useLocation()
  const search = useHomeSearch()
  const enabled = useTipsEnabled()
  const tourDone = useTourStep() === TOUR_DONE
  const { role } = useSession()
  const alone = useMembers().data?.length === 1
  const { mutate: createInvite } = useCreateInvite()

  const ready = enabled && tourDone && loaded && pathname === '/' && !search.open
  const count = products.length
  const rowId = products[0]?.id
  const firstSectionId = sections[0]?.id
  // Приглашает владелец; в демо-режиме приглашений нет.
  const canInvite = backend.mode !== 'local' && role === 'owner' && alone

  const invite = useMemo<CoachRequest | null>(
    () =>
      ready && canInvite
        ? {
            id: 'invite',
            order: 10,
            tap: 'none',
            steps: [{ title: t('coach.inviteTitle'), text: t('coach.invite') }],
            actions: [
              { label: t('coach.later') },
              {
                label: t('coach.inviteAction'),
                primary: true,
                run: () =>
                  createInvite(undefined, {
                    onSuccess: (token) => openSheet({ type: 'invite-link', link: inviteLink(token) }),
                  }),
              },
            ],
          }
        : null,
    [ready, canInvite, createInvite, t],
  )

  const dragProducts = useMemo<CoachRequest | null>(
    () =>
      ready && rowId && count >= DRAG_PRODUCTS_AT
        ? {
            id: 'feature-drag-products',
            kind: 'feature',
            order: 11,
            tap: 'none',
            steps: [{ target: `item-${rowId}-row`, title: t('tip.title'), text: t('coach.drag'), motion: 'lift' }],
          }
        : null,
    [ready, rowId, count, t],
  )

  const dragSections = useMemo<CoachRequest | null>(
    () =>
      ready && firstSectionId && sections.length >= DRAG_SECTIONS_AT
        ? {
            id: 'feature-drag-sections',
            kind: 'feature',
            order: 12,
            tap: 'none',
            steps: [{ target: `section-${firstSectionId}`, title: t('tip.title'), text: t('coach.dragSections') }],
          }
        : null,
    [ready, firstSectionId, sections.length, t],
  )

  const findByName = useMemo<CoachRequest | null>(
    () =>
      ready && count >= SEARCH_MIN_PRODUCTS
        ? {
            id: 'feature-search',
            kind: 'feature',
            order: 13,
            tap: 'press',
            steps: [{ target: 'search', title: t('tip.title'), text: t('coach.search'), motion: 'shake' }],
          }
        : null,
    [ready, count, t],
  )

  useCoach('invite', invite)
  useCoach('feature-drag-products', dragProducts)
  useCoach('feature-drag-sections', dragSections)
  useCoach('feature-search', findByName)
}
