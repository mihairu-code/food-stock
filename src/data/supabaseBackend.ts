import { createClient, type PostgrestError, type User as AuthUser } from '@supabase/supabase-js'
import type {
  Household,
  Invite,
  Member,
  Membership,
  MergePreview,
  Product,
  Role,
  Section,
  ShoppingItem,
  User,
} from '@/domain/types'
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

function toUser(user: AuthUser): User {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined
  return {
    id: user.id,
    isAnonymous: user.is_anonymous ?? false,
    email: user.email ?? null,
    name: meta?.full_name ?? meta?.name ?? null,
  }
}

/**
 * Общий дом на Supabase: Postgres + Auth + Realtime.
 *
 * Начать можно без регистрации — тогда создаётся анонимный пользователь, сессия
 * которого хранится на устройстве. Вход через Google делает человека одним и тем же
 * на всех устройствах. Доступ ограничивают политики RLS из supabase/migrations —
 * клиент знает только публичный ключ и никогда service-role.
 */
export function createSupabaseBackend(url: string, publicKey: string): Backend {
  // PKCE: после возврата от Google в адресе только одноразовый код, а не токены.
  const supabase = createClient(url, publicKey, { auth: { flowType: 'pkce' } })

  // Одновременные вызовы (например, двойной эффект StrictMode) не должны
  // создать двух анонимных пользователей.
  let pendingAnonymous: Promise<User> | null = null
  let googleEnabled: Promise<boolean> | null = null

  return {
    mode: 'supabase',

    currentUser: async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw new Error(error.message)
      return data.session ? toUser(data.session.user) : null
    },
    continueAnonymously: () => {
      pendingAnonymous ??= (async () => {
        const existing = await supabase.auth.getSession()
        if (existing.data.session) return toUser(existing.data.session.user)
        const created = await supabase.auth.signInAnonymously()
        if (created.error || !created.data.user) {
          throw new Error(created.error?.message ?? 'Не удалось создать пользователя')
        }
        return toUser(created.data.user)
      })().finally(() => {
        pendingAnonymous = null
      })
      return pendingAnonymous
    },
    onAuthChange: (callback) => {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        // Вызов откладывается: внутри обработчика нельзя обращаться к supabase.auth.
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          window.setTimeout(callback, 0)
        }
      })
      return () => data.subscription.unsubscribe()
    },

    googleAvailable: () => {
      googleEnabled ??= fetch(`${url}/auth/v1/settings`, { headers: { apikey: publicKey } })
        .then((response) => response.json() as Promise<{ external?: { google?: boolean } }>)
        .then((settings) => settings.external?.google === true)
        .catch(() => false)
      return googleEnabled
    },
    signInWithGoogle: async () => {
      check(
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
            // Всегда показывать выбор аккаунта: на общем телефоне иначе войдёт «не тот» человек.
            queryParams: { prompt: 'select_account' },
          },
        }),
      )
    },
    signOut: async () => {
      // Только на этом устройстве: на остальных человек остаётся в аккаунте.
      check(await supabase.auth.signOut({ scope: 'local' }))
    },

    createMergeTicket: async () => unwrap(await supabase.rpc('create_merge_ticket')) as string,
    previewMerge: async (ticket) =>
      unwrap(await supabase.rpc('preview_merge', { p_token: ticket })) as MergePreview,
    completeMerge: async (ticket, keep) =>
      unwrap(await supabase.rpc('complete_merge', { p_token: ticket, p_keep: keep })) as string | null,
    syncProfile: async (device, displayName) => {
      check(await supabase.rpc('sync_profile', { p_device: device, p_display_name: displayName }))
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
    createHousehold: async (name, displayName) =>
      unwrap(await supabase.rpc('create_household', { p_name: name, p_display_name: displayName })) as string,

    listMembers: async (householdId) =>
      unwrap(
        await supabase.from('household_members').select('*').eq('household_id', householdId).order('created_at'),
      ) as Member[],
    setDisplayName: async (householdId, displayName) => {
      const { data } = await supabase.auth.getSession()
      check(
        await supabase
          .from('household_members')
          .update({ display_name: displayName })
          .eq('household_id', householdId)
          .eq('user_id', data.session?.user.id ?? ''),
      )
    },
    removeMember: async (householdId, userId) => {
      check(await supabase.from('household_members').delete().eq('household_id', householdId).eq('user_id', userId))
    },

    listInvites: async (householdId) =>
      unwrap(
        await supabase
          .from('household_invites')
          // Столбец token_hash клиенту недоступен, поэтому столбцы перечислены явно.
          .select('id, household_id, created_at, expires_at')
          .eq('household_id', householdId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at'),
      ) as Invite[],
    createInvite: async (householdId) =>
      unwrap(await supabase.rpc('create_invite', { p_household_id: householdId })) as string,
    deleteInvite: async (inviteId) => {
      check(await supabase.from('household_invites').delete().eq('id', inviteId))
    },
    joinHousehold: async (token, displayName) =>
      unwrap(await supabase.rpc('join_household', { p_token: token, p_display_name: displayName })) as string,

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
    reorderSections: async (sectionIds) => {
      check(await supabase.rpc('reorder_sections', { p_section_ids: sectionIds }))
    },

    createProduct: async (householdId, input) =>
      unwrap(
        await supabase
          .from('products')
          .insert({ household_id: householdId, ...input })
          .select()
          .single(),
      ) as Product,
    setProductState: async (productId, state) => {
      check(
        await supabase
          .from('products')
          .update({ is_available: state.is_available, to_buy: state.to_buy })
          .eq('id', productId),
      )
    },
    deleteProduct: async (productId) => {
      check(await supabase.from('products').delete().eq('id', productId))
    },
    reorderProducts: async (sectionId, productIds) => {
      check(
        await supabase.rpc('reorder_products', { p_section_id: sectionId, p_product_ids: productIds }),
      )
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
