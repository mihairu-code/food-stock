import { createClient, type PostgrestError } from '@supabase/supabase-js'
import type { Household, Membership, Product, Role, Section, ShoppingItem } from '@/domain/types'
import type { Backend } from './backend'

const REALTIME_TABLES = [
  'households',
  'household_members',
  'household_invites',
  'sections',
  'products',
  'shopping_items',
] as const

function unwrap<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}

function check(result: { error: { message: string } | null }): void {
  if (result.error) throw new Error(result.error.message)
}

/**
 * Общий дом на Supabase: Postgres + Auth + Realtime. Доступ ограничивают политики RLS
 * из supabase/migrations — клиент знает только публичный ключ и никогда service-role.
 */
export function createSupabaseBackend(url: string, publicKey: string): Backend {
  const supabase = createClient(url, publicKey)

  return {
    mode: 'supabase',

    currentUser: async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw new Error(error.message)
      const user = data.session?.user
      return user ? { id: user.id, email: user.email ?? null } : null
    },

    listMemberships: async () => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) return []
      const rows = unwrap(
        await supabase
          .from('household_members')
          .select('role, households(*)')
          .eq('user_id', userId)
          .order('created_at'),
      ) as unknown as { role: Role; households: Household }[]
      return rows.map((row): Membership => ({ household: row.households, role: row.role }))
    },

    listSections: async (householdId) =>
      unwrap(await supabase.from('sections').select('*').eq('household_id', householdId)) as Section[],
    listProducts: async (householdId) =>
      unwrap(await supabase.from('products').select('*').eq('household_id', householdId)) as Product[],
    listShoppingItems: async (householdId) =>
      unwrap(
        await supabase.from('shopping_items').select('*').eq('household_id', householdId),
      ) as ShoppingItem[],

    createSection: async (householdId, input) =>
      unwrap(
        await supabase
          .from('sections')
          .insert({ household_id: householdId, ...input })
          .select()
          .single(),
      ) as Section,
    updateSection: async (sectionId, patch) => {
      check(await supabase.from('sections').update(patch).eq('id', sectionId))
    },
    deleteSection: async (sectionId) => {
      check(await supabase.from('sections').delete().eq('id', sectionId))
    },

    createProduct: async (householdId, input) =>
      unwrap(
        await supabase
          .from('products')
          .insert({ household_id: householdId, ...input })
          .select()
          .single(),
      ) as Product,
    setAvailability: async (productId, available) => {
      check(await supabase.from('products').update({ is_available: available }).eq('id', productId))
    },
    deleteProduct: async (productId) => {
      check(await supabase.from('products').delete().eq('id', productId))
    },

    createShoppingItem: async (householdId, input) =>
      unwrap(
        await supabase
          .from('shopping_items')
          .insert({ household_id: householdId, ...input })
          .select()
          .single(),
      ) as ShoppingItem,
    deleteShoppingItem: async (itemId) => {
      check(await supabase.from('shopping_items').delete().eq('id', itemId))
    },
    purchaseShoppingItem: async (itemId, sectionId, makeStaple) => {
      check(
        await supabase.rpc('purchase_shopping_item', {
          p_item_id: itemId,
          p_section_id: sectionId,
          p_make_staple: makeStaple,
        }),
      )
    },

    subscribe: (onChange) => {
      // Без фильтра по дому: INSERT/UPDATE и так ограничены RLS, а DELETE-события
      // Postgres Changes фильтровать не умеет. Любое событие — повод перечитать данные.
      let channel = supabase.channel(`home-stock-${crypto.randomUUID()}`)
      for (const table of REALTIME_TABLES) {
        channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
      }
      channel.subscribe()
      return () => {
        void supabase.removeChannel(channel)
      }
    },
  }
}
