import type { MergeHome } from '@/domain/types'
import { plural } from '@/lib/plural'

/** «3 раздела · 12 продуктов · 2 участника». */
export const homeSummary = (home: MergeHome) =>
  [
    plural(home.sections, ['раздел', 'раздела', 'разделов']),
    plural(home.products, ['продукт', 'продукта', 'продуктов']),
    plural(home.members, ['участник', 'участника', 'участников']),
  ].join(' · ')

export const homeNames = (homes: MergeHome[]) => homes.map((home) => `«${home.name}»`).join(', ')

/** Что станет с домами, которые не оставили: дом, где есть другие люди, не удаляется — человек только выходит из него. */
export const fateOf = (homes: MergeHome[]) =>
  homes.every((home) => home.members > 1)
    ? `Из ${homeNames(homes)} вы выйдете, остальные участники останутся.`
    : `${homeNames(homes)} будет удалён вместе со всеми данными.`
