export type ProductKind = 'staple' | 'one_off'
export type Role = 'owner' | 'member'

export interface User {
  id: string
  email: string | null
}

export interface Household {
  id: string
  name: string
  created_at: string
}

export interface Membership {
  household: Household
  role: Role
}

export interface Member {
  household_id: string
  user_id: string
  role: Role
  /** Почта на момент вступления: auth.users клиенту недоступна. */
  email: string
  created_at: string
}

/** Отправленное приглашение: принять его может только вошедший с этой почтой. */
export interface Invite {
  id: string
  household_id: string
  email: string
  created_at: string
}

/** Приглашение, адресованное мне, — с названием дома, которого я ещё не вижу. */
export interface IncomingInvite {
  id: string
  household_id: string
  household_name: string
  invited_by_email: string | null
}

export interface Section {
  id: string
  household_id: string
  name: string
  icon: string | null
  sort_order: number
  created_at: string
}

/**
 * `staple` — постоянный: закончившись, сам попадает в покупки.
 * `one_off` — разовый: существует, только пока он есть дома.
 */
export interface Product {
  id: string
  household_id: string
  section_id: string
  name: string
  icon: string | null
  kind: ProductKind
  is_available: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

/** Позиция покупок, добавленная вручную. Закончившиеся постоянные продукты сюда не копируются. */
export interface ShoppingItem {
  id: string
  household_id: string
  name: string
  icon: string | null
  created_at: string
  created_by: string | null
}
