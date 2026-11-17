import { createClient, type PostgrestError, type User as AuthUser } from '@supabase/supabase-js'
import type { Backend } from './backend'
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
} from './types'

const REALTIME_TABLES = [
  'households',
  'household_members',
  'household_invites',
  'sections',
  'products',
  'shopping_items',
] as const

function dataOrThrow<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}

function throwIfFailed(result: { error: { message: string } | null }): void {
  if (result.error) throw new Error(result.error.message)
}

function toUser(user: AuthUser): User {
  const meta = user.user_metadata as
    | { full_name?: string; name?: string; avatar_url?: string; picture?: string }
    | undefined
  return {
    id: user.id,
    isAnonymous: user.is_anonymous ?? false,
    email: user.email ?? null,
    name: meta?.full_name ?? meta?.name ?? null,
    avatarUrl: meta?.avatar_url ?? meta?.picture ?? null,
    createdAt: user.created_at ?? null,
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

  async function currentUserId(): Promise<string> {
    const { data } = await supabase.auth.getSession()
    const id = data.session?.user.id
    if (!id) throw new Error('Нет активной сессии')
    return id
  }

  return {
    mode: 'supabase',

    currentUser: async () => {
      // getSession дожидается инициализации клиента, в том числе обмена кода от Google.
      const { data, error } = await supabase.auth.getSession()
      if (error) throw new Error(error.message)
      return data.session ? toUser(data.session.user) : null
    },
    continueAnonymously: () => {
      pendingAnonymous ??= (async (): Promise<User> => {
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
      throwIfFailed(
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
      throwIfFailed(await supabase.auth.signOut({ scope: 'local' }))
    },

    createMergeTicket: async () => dataOrThrow(await supabase.rpc('create_merge_ticket')) as string,
    previewMerge: async (ticket) =>
      dataOrThrow(await supabase.rpc('preview_merge', { p_token: ticket })) as MergePreview,
    completeMerge: async (ticket, keep) =>
      dataOrThrow(await supabase.rpc('complete_merge', { p_token: ticket, p_keep: keep })) as string | null,
    syncProfile: async (device, displayName) => {
      throwIfFailed(await supabase.rpc('sync_profile', { p_device: device, p_display_name: displayName }))
    },

    listMemberships: async () => {
      const { data: auth } = await supabase.auth.getSession()
      const userId = auth.session?.user.id
      if (!userId) return []
      const rows = dataOrThrow(
        await supabase
          .from('household_members')
          .select('role, created_at, household:households(id, name, icon, created_at)')
          .eq('user_id', userId)
          .order('created_at'),
      ) as unknown as { role: Role; household: Household | null }[]
      return rows.flatMap((row): Membership[] =>
        row.household ? [{ household: row.household, role: row.role }] : [],
      )
    },
    createHousehold: async (name, displayName) =>
      dataOrThrow(
        await supabase.rpc('create_household', { p_name: name, p_display_name: displayName }),
      ) as string,
    updateHousehold: async (householdId, patch) => {
      throwIfFailed(await supabase.from('households').update(patch).eq('id', householdId))
    },

    listMembers: async (householdId) =>
      dataOrThrow(
        await supabase
          .from('household_members')
          .select('household_id, user_id, role, display_name, device, account_email, avatar_url, created_at')
          .eq('household_id', householdId)
          .order('created_at'),
      ) as Member[],
    setDisplayName: async (householdId, displayName) => {
      throwIfFailed(
        await supabase
          .from('household_members')
          .update({ display_name: displayName })
          .eq('household_id', householdId)
          .eq('user_id', await currentUserId()),
      )
    },
    removeMember: async (householdId, userId) => {
      throwIfFailed(
        await supabase
          .from('household_members')
          .delete()
          .eq('household_id', householdId)
          .eq('user_id', userId),
      )
    },

    listInvites: async (householdId) =>
      dataOrThrow(
        await supabase
          .from('household_invites')
          // Столбец token_hash клиенту недоступен, поэтому столбцы перечислены явно.
          .select('id, household_id, created_at, expires_at')
          .eq('household_id', householdId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at'),
      ) as Invite[],
    createInvite: async (householdId) =>
      dataOrThrow(await supabase.rpc('create_invite', { p_household_id: householdId })) as string,
    deleteInvite: async (inviteId) => {
      throwIfFailed(await supabase.from('household_invites').delete().eq('id', inviteId))
    },
    joinHousehold: async (token, displayName) =>
      dataOrThrow(
        await supabase.rpc('join_household', { p_token: token, p_display_name: displayName }),
      ) as string,

    listSections: async (householdId) =>
      dataOrThrow(
        await supabase.from('sections').select('*').eq('household_id', householdId),
      ) as Section[],
    listProducts: async (householdId) =>
      dataOrThrow(
        await supabase.from('products').select('*').eq('household_id', householdId),
      ) as Product[],
    listShoppingItems: async (householdId) =>
      dataOrThrow(
        await supabase.from('shopping_items').select('*').eq('household_id', householdId),
      ) as ShoppingItem[],

    createSection: async (householdId, input) =>
      dataOrThrow(
        await supabase
          .from('sections')
          .insert({ household_id: householdId, ...input })
          .select()
          .single(),
      ) as Section,
    updateSection: async (sectionId, patch) => {
      throwIfFailed(await supabase.from('sections').update(patch).eq('id', sectionId))
    },
    deleteSection: async (sectionId) => {
      throwIfFailed(await supabase.from('sections').delete().eq('id', sectionId))
    },
    reorderSections: async (sectionIds) => {
      throwIfFailed(await supabase.rpc('reorder_sections', { p_section_ids: sectionIds }))
    },

    createProduct: async (householdId, input) =>
      dataOrThrow(
        await supabase
          .from('products')
          .insert({ household_id: householdId, ...input })
          .select()
          .single(),
      ) as Product,
    setProductState: async (productId, state) => {
      throwIfFailed(
        await supabase
          .from('products')
          .update({ is_available: state.is_available, to_buy: state.to_buy })
          .eq('id', productId),
      )
    },
    updateProduct: async (productId, patch) => {
      throwIfFailed(
        await supabase
          .from('products')
          .update({ name: patch.name, icon: patch.icon, kind: patch.kind })
          .eq('id', productId),
      )
    },
    deleteProduct: async (productId) => {
      throwIfFailed(await supabase.from('products').delete().eq('id', productId))
    },
    reorderProducts: async (sectionId, productIds) => {
      throwIfFailed(
        await supabase.rpc('reorder_products', { p_section_id: sectionId, p_product_ids: productIds }),
      )
    },

    createShoppingItem: async (householdId, input) =>
      dataOrThrow(
        await supabase
          .from('shopping_items')
          .insert({ household_id: householdId, ...input })
          .select()
          .single(),
      ) as ShoppingItem,
    updateShoppingItem: async (itemId, patch) => {
      throwIfFailed(
        await supabase.from('shopping_items').update({ name: patch.name, icon: patch.icon }).eq('id', itemId),
      )
    },
    deleteShoppingItem: async (itemId) => {
      throwIfFailed(await supabase.from('shopping_items').delete().eq('id', itemId))
    },
    reorderShopping: async (ids) => {
      throwIfFailed(await supabase.rpc('reorder_shopping', { p_ids: ids }))
    },
    purchaseShoppingItem: async (itemId, sectionId, makeStaple) => {
      throwIfFailed(
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
        channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () =>
          onChange(),
        )
      }
      channel.subscribe()
      return () => {
        void supabase.removeChannel(channel)
      }
    },
  }
}
