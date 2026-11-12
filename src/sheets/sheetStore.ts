import type { Member, Section, ShoppingItem } from '@/domain/types'
import { createStore, useStore } from '@/lib/store'

/** Какая шторка открыта и с какими данными. Одновременно открыта только одна. */
export type SheetRequest =
  | { type: 'add-product'; sectionId?: string }
  | { type: 'add-section' }
  | { type: 'manage-section'; section: Section }
  | { type: 'add-item' }
  | { type: 'purchase'; item: ShoppingItem }
  | { type: 'invite-link'; link: string }
  | { type: 'join' }
  | { type: 'my-name'; current: string }
  | { type: 'remove-member'; member: Member }
  | { type: 'sign-out' }
  | { type: 'reset' }

const active = createStore<SheetRequest | null>(null)

/** Открывает шторку. Вызывается из любого места: экран не хранит её состояние и не рисует её сам. */
export const openSheet = (request: SheetRequest): void => active.set(request)

export const closeSheet = (): void => active.set(null)

export const useActiveSheet = () => useStore(active)
