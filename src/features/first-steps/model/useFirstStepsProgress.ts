import { useEffect } from 'react'
import { useMembers } from '@/entities/member'
import { useHomeData } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { countFirstSteps, FIRST_STEPS, markFirstStep, useFirstStepsMarked } from '@/shared/lib/coach/firstSteps'

/**
 * Строка прогресса в окнах подсказок: «Первые шаги · 2 из 5». Раздел, продукт и второй
 * участник видны по данным дома; увиденный шаг запоминается, чтобы не пропасть, если
 * данные изменятся (раздел удалили, участник ушёл).
 */
export function useFirstStepsProgress(): string {
  const t = useT()
  const { sections, products } = useHomeData()
  const members = useMembers().data ?? []
  const marked = useFirstStepsMarked()
  const hasSection = sections.length > 0
  const hasProduct = products.length > 0
  const together = members.length > 1

  useEffect(() => {
    if (hasSection) markFirstStep('section')
    if (hasProduct) markFirstStep('product')
    if (together) markFirstStep('invited')
  }, [hasSection, hasProduct, together])

  const done = countFirstSteps(marked, { section: hasSection, product: hasProduct, invited: together })
  return t('coach.firstSteps', { done, total: FIRST_STEPS.length })
}
