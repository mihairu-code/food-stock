import type {
  IncomingInvite,
  Invite,
  Member,
  Membership,
  Product,
  ProductKind,
  Section,
  ShoppingItem,
  User,
} from '@/domain/types'

export interface NewSection {
  name: string
  icon: string | null
  sort_order: number
}

export interface SectionPatch {
  name: string
  icon: string | null
}

export interface NewProduct {
  section_id: string
  name: string
  icon: string | null
  kind: ProductKind
}

export interface NewShoppingItem {
  name: string
  icon: string | null
}

/**
 * Единственная граница между интерфейсом и хранилищем.
 * Реализации: localBackend (демо без сервера) и supabaseBackend (общий дом).
 */
export interface Backend {
  readonly mode: 'local' | 'supabase'

  /** Пользователь этого устройства или null, если он не вошёл. */
  currentUser(): Promise<User | null>
  /** Сессия изменилась (вход, выход) — пользователя нужно перечитать. */
  onAuthChange(callback: () => void): () => void
  /** Отправляет на почту одноразовый код для входа. */
  sendEmailCode(email: string): Promise<void>
  verifyEmailCode(email: string, code: string): Promise<void>
  signOut(): Promise<void>

  listMemberships(): Promise<Membership[]>
  /** Создаёт дом и делает текущего пользователя владельцем; возвращает id дома. */
  createHousehold(name: string): Promise<string>

  listMembers(householdId: string): Promise<Member[]>
  removeMember(householdId: string, userId: string): Promise<void>

  listInvites(householdId: string): Promise<Invite[]>
  createInvite(householdId: string, email: string): Promise<void>
  deleteInvite(inviteId: string): Promise<void>
  listMyInvites(): Promise<IncomingInvite[]>
  /** Принять приглашение; возвращает id дома. */
  acceptInvite(inviteId: string): Promise<string>

  listSections(householdId: string): Promise<Section[]>
  listProducts(householdId: string): Promise<Product[]>
  listShoppingItems(householdId: string): Promise<ShoppingItem[]>

  createSection(householdId: string, input: NewSection): Promise<Section>
  updateSection(sectionId: string, patch: SectionPatch): Promise<void>
  /** Каскадно удаляет продукты раздела (и тем самым их строки в покупках). */
  deleteSection(sectionId: string): Promise<void>

  createProduct(householdId: string, input: NewProduct): Promise<Product>
  setAvailability(productId: string, available: boolean): Promise<void>
  deleteProduct(productId: string): Promise<void>

  createShoppingItem(householdId: string, input: NewShoppingItem): Promise<ShoppingItem>
  deleteShoppingItem(itemId: string): Promise<void>
  /** Атомарно: создать продукт в разделе и убрать позицию из покупок. */
  purchaseShoppingItem(itemId: string, sectionId: string, makeStaple: boolean): Promise<void>

  /** Сообщает об изменениях, сделанных не в этой вкладке. */
  subscribe(onChange: () => void): () => void

  /** Только локальный режим: вернуть демо-данные к исходным. */
  resetLocalData?(): Promise<void>
}
