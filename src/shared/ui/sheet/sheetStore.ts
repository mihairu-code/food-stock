import type { Product, Section, ShoppingItem } from '@/shared/api'
import { createStore, useStore } from '@/shared/lib/store'
import type { ConfirmSheetProps } from './ConfirmSheet'

/** Какая шторка открыта и с какими данными. Одновременно открыта только одна. */
export type SheetRequest =
  | { type: 'add-product'; sectionId?: string }
  | { type: 'edit-product'; product: Product }
  | { type: 'add-section' }
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
