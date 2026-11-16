import type { MergeHome } from '@/shared/api'
import type { Translate } from '@/shared/i18n'

/** «3 раздела · 12 продуктов · 2 участника». */
export const homeSummary = (home: MergeHome, t: Translate) =>
  [
    t('n.sections', { count: home.sections }),
    t('n.products', { count: home.products }),
    t('n.members', { count: home.members }),
  ].join(' · ')

export const homeNames = (homes: MergeHome[], t: Translate) =>
  homes.map((home) => t('quote', { name: home.name })).join(', ')

/** Что станет с домами, которые не оставили: дом, где есть другие люди, не удаляется — человек только выходит из него. */
export const fateOf = (homes: MergeHome[], t: Translate) =>
  t(homes.every((home) => home.members > 1) ? 'merge.fateLeave' : 'merge.fateDelete', {
    homes: homeNames(homes, t),
  })
