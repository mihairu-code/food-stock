import type { ProductState } from '@/domain/logic'
import type {
  Invite,
  Member,
  Membership,
  MergeKeep,
  MergePreview,
  Product,
  ProductKind,
  Section,
  ShoppingItem,
  User,
} from '@/domain/types'

/* Идентификатор новой записи выдаёт клиент: так строку можно показать в списке
   сразу, не дожидаясь ответа сервера, и она не «переедет» после сохранения. */

export interface NewSection {
  id: string
  name: string
  icon: string | null
  sort_order: number
}

export interface SectionPatch {
  name: string
  icon: string | null
}

export interface HouseholdPatch {
  name: string
  icon: string | null
}

export interface NewProduct {
  id: string
  section_id: string
  name: string
  icon: string | null
  kind: ProductKind
}

export interface NewShoppingItem {
  id: string
  name: string
  icon: string | null
}

/**
 * Единственная граница между интерфейсом и хранилищем.
 * Реализации: localBackend (демо без сервера) и supabaseBackend (общий дом).
 */
export interface Backend {
  readonly mode: 'local' | 'supabase'

  /** Пользователь этого устройства или null, если человек ещё не начинал. */
  currentUser(): Promise<User | null>
  /** Начать без аккаунта: создаёт анонимного пользователя на этом устройстве. */
  continueAnonymously(): Promise<User>
  /** Сессия изменилась (вход, выход) — пользователя нужно перечитать. */
  onAuthChange(callback: () => void): () => void

  /** Настроен ли на сервере вход через Google. */
  googleAvailable(): Promise<boolean>
  /** Уводит на страницу Google; после возврата currentUser() вернёт аккаунт. */
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>

  /**
   * Слияние анонимного пользователя устройства с аккаунтом. Билет берут до входа,
   * а после входа им подтверждают, что данные устройства принадлежат тому же человеку.
   */
  createMergeTicket(): Promise<string>
  previewMerge(ticket: string): Promise<MergePreview>
  /** Возвращает дом, который стоит открыть; null — сливать было нечего. */
  completeMerge(ticket: string, keep: MergeKeep | null): Promise<string | null>

  /** Записывает устройство, фото аккаунта и (если своё не задано) имя во все дома пользователя. */
  syncProfile(device: string, displayName: string): Promise<void>

  listMemberships(): Promise<Membership[]>
  createHousehold(name: string, displayName: string): Promise<string>
  /** Название и аватарка дома; меняет владелец. */
  updateHousehold(householdId: string, patch: HouseholdPatch): Promise<void>

  listMembers(householdId: string): Promise<Member[]>
  setDisplayName(householdId: string, displayName: string): Promise<void>
  removeMember(householdId: string, userId: string): Promise<void>

  listInvites(householdId: string): Promise<Invite[]>
  /** Создаёт одноразовую ссылку и возвращает её токен — больше его получить нельзя. */
  createInvite(householdId: string): Promise<string>
  deleteInvite(inviteId: string): Promise<void>
  /** Вступить в дом по токену из ссылки; возвращает идентификатор дома. */
  joinHousehold(token: string, displayName: string): Promise<string>

  listSections(householdId: string): Promise<Section[]>
  listProducts(householdId: string): Promise<Product[]>
  listShoppingItems(householdId: string): Promise<ShoppingItem[]>

  createSection(householdId: string, input: NewSection): Promise<Section>
  updateSection(sectionId: string, patch: SectionPatch): Promise<void>
  /** Каскадно удаляет продукты раздела (и тем самым их строки в покупках). */
  deleteSection(sectionId: string): Promise<void>
  /** Новый порядок разделов дома: идентификаторы сверху вниз. */
  reorderSections(sectionIds: string[]): Promise<void>

  createProduct(householdId: string, input: NewProduct): Promise<Product>
  /** Записывает обе отметки продукта сразу: наличие дома и «в покупках». */
  setProductState(productId: string, state: ProductState): Promise<void>
  deleteProduct(productId: string): Promise<void>
  /**
   * Продукты раздела в новом порядке, сверху вниз. Продукт из другого раздела,
   * оказавшийся в списке, переносится в этот раздел.
   */
  reorderProducts(sectionId: string, productIds: string[]): Promise<void>

  createShoppingItem(householdId: string, input: NewShoppingItem): Promise<ShoppingItem>
  deleteShoppingItem(itemId: string): Promise<void>
  /** Список покупок в новом порядке: идентификаторы продуктов и ручных позиций вперемешку, сверху вниз. */
  reorderShopping(ids: string[]): Promise<void>
  /** Атомарно: создать продукт в разделе и убрать позицию из покупок. */
  purchaseShoppingItem(itemId: string, sectionId: string, makeStaple: boolean): Promise<void>

  /** Сообщает об изменениях, сделанных не в этой вкладке (другой участник или устройство). */
  subscribe(onChange: () => void): () => void

  /** Только локальный режим: вернуть демо-данные к исходным. */
  resetLocalData?(): Promise<void>
}
