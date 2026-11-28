import type { Product, Section, ShoppingItem } from '@/shared/api'
import { createStore, useStore } from '@/shared/lib/store'
import type { ConfirmSheetProps } from './ConfirmSheet'

/**
 * «Свой раздел» среди готовых на пустом доме: шторка не создаёт раздел, а отдаёт название
 * и иконку. Раздел создастся вместе с отмеченными готовыми.
 */
export interface SectionPick {
  /** Названия, уже занятые другими кнопками. */
  taken: readonly string[]
  onPick: (picked: { name: string; icon: string }) => void
}

/** Какая шторка открыта и с какими данными. Одновременно открыта только одна. */
export type SheetRequest =
  /** `name` — готовое название: «Добавить „…“», когда поиск по дому ничего не нашёл. */
  | { type: 'add-product'; sectionId?: string; name?: string }
  | { type: 'edit-product'; product: Product }
  | { type: 'add-section'; pick?: SectionPick }
  | { type: 'manage-section'; section: Section }
  | { type: 'add-item' }
  | { type: 'edit-item'; item: ShoppingItem }
  | { type: 'purchase'; item: ShoppingItem }
  | { type: 'invite-link'; link: string }
  | { type: 'join' }
  | { type: 'my-name'; current: string }
  | { type: 'edit-home' }
  /** Подтверждение необратимого действия: что именно сделать, решает тот, кто открыл шторку. */
  | ({ type: 'confirm' } & ConfirmSheetProps)

const activeSheet = createStore<SheetRequest | null>(null)

/** Открывает шторку. Вызывается из любого места: экран не хранит её состояние и не рисует её сам. */
export const openSheet = (request: SheetRequest): void => activeSheet.set(request)

export const closeSheet = (): void => activeSheet.set(null)

export const useActiveSheet = () => useStore(activeSheet)
