export type ProductKind = 'staple' | 'one_off'
export type Role = 'owner' | 'member'

/** Пользователь без регистрации: анонимный пользователь Supabase, живёт на этом устройстве. */
export interface User {
  id: string
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
  /** Необязательное имя, которое участник задал сам. */
  display_name: string
  created_at: string
}

/** Действующая одноразовая ссылка-приглашение. Сам токен нигде не хранится. */
export interface Invite {
  id: string
  household_id: string
  created_at: string
  expires_at: string
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
