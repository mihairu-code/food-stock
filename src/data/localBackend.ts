import {
  purchaseManualItem,
  removeProduct,
  removeSection,
  setProductState,
  type HomeData,
} from '@/domain/logic'
import type { Household, Product, Section, ShoppingItem, User } from '@/domain/types'
import { translate as t } from '@/i18n'
import type { Backend } from './backend'

const STORAGE_KEY = 'home-stock:local:v1'
const LOCAL_USER: User = { id: 'local-user', isAnonymous: true, email: null, name: null }

interface LocalState extends HomeData {
  household: Household
}

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function seed(): LocalState {
  const now = Date.now()
  const at = (offset: number) => new Date(now + offset).toISOString()
  const hid = crypto.randomUUID()
  const household: Household = { id: hid, name: t('home.defaultName'), created_at: at(0) }

  let tick = 0
  const section = (name: string, icon: string): Section => ({
    id: crypto.randomUUID(),
    household_id: hid,
    name,
    icon,
    sort_order: tick,
    created_at: at(tick++),
  })
  const product = (
    s: Section,
    name: string,
    icon: string,
    kind: Product['kind'],
    is_available = true,
  ): Product => ({
    id: crypto.randomUUID(),
    household_id: hid,
    section_id: s.id,
    name,
    icon,
    kind,
    is_available,
    to_buy: !is_available,
    created_at: at(tick),
    updated_at: at(tick++),
    created_by: LOCAL_USER.id,
  })
  const item = (name: string, icon: string): ShoppingItem => ({
    id: crypto.randomUUID(),
    household_id: hid,
    name,
    icon,
    created_at: at(tick++),
    created_by: LOCAL_USER.id,
  })

  // Демо-набор заводится один раз, на языке интерфейса в этот момент.
  const fridge = section(t('demo.fridge'), '🧊')
  const cupboard = section(t('demo.cupboard'), '🧺')
  const treats = section(t('demo.treats'), '🍪')

  return {
    household,
    sections: [fridge, cupboard, treats],
    products: [
      product(fridge, t('demo.milk'), '🥛', 'staple', false),
      product(fridge, t('demo.eggs'), '🥚', 'staple'),
      product(fridge, t('demo.cheese'), '🧀', 'staple'),
      product(fridge, t('demo.strawberry'), '🍓', 'one_off'),
      product(cupboard, t('demo.coffee'), '☕', 'staple'),
      product(cupboard, t('demo.rice'), '🍚', 'staple'),
      product(treats, t('demo.chocolate'), '🍫', 'one_off'),
    ],
    shoppingItems: [item(t('demo.coffeeBeans'), '🫘'), item(t('demo.bread'), '🍞')],
  }
}

/**
 * Демо-режим без сервера: данные лежат в localStorage этого браузера.
 * Вкладки одного браузера синхронизируются через событие `storage`.
 */
export function createLocalBackend(store: KeyValueStore = window.localStorage): Backend {
  function read(): LocalState {
    const raw = store.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const state = JSON.parse(raw) as LocalState
        // Данные, сохранённые до появления отметки «в покупках»: тогда в списке были
        // закончившиеся постоянные продукты.
        const products = state.products.map((p) =>
          typeof p.to_buy === 'boolean' ? p : { ...p, to_buy: p.kind === 'staple' && !p.is_available },
        )
        return { ...state, products }
      } catch {
        // повреждённые данные — начинаем с демо-набора
      }
    }
    const initial = seed()
    store.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }

  function write(next: LocalState): void {
    store.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function update(change: (state: LocalState) => LocalState): void {
    write(change(read()))
  }

  const now = () => new Date().toISOString()
  const notSupported = () => Promise.reject(new Error('Недоступно в локальном режиме'))

  return {
    mode: 'local',

    currentUser: async () => LOCAL_USER,
    continueAnonymously: async () => LOCAL_USER,
    onAuthChange: () => () => {},
    googleAvailable: async () => false,
    signInWithGoogle: notSupported,
    createMergeTicket: notSupported,
    previewMerge: notSupported,
    completeMerge: notSupported,
    syncProfile: async () => {},

    listMemberships: async () => [{ household: read().household, role: 'owner' }],
    createHousehold: async (name) => {
      update((s) => ({ ...s, household: { ...s.household, name } }))
      return read().household.id
    },

    listMembers: async () => {
      const { household } = read()
      return [
        { household_id: household.id, user_id: LOCAL_USER.id, role: 'owner', display_name: '', device: '', account_email: null, created_at: household.created_at },
      ]
    },
    setDisplayName: notSupported,
    removeMember: notSupported,

    listInvites: async () => [],
    createInvite: notSupported,
    deleteInvite: notSupported,
    joinHousehold: notSupported,

    listSections: async () => read().sections,
    listProducts: async () => read().products,
    listShoppingItems: async () => read().shoppingItems,

    createSection: async (householdId, input) => {
      const section: Section = {
        household_id: householdId,
        created_at: now(),
        ...input,
      }
      update((s) => ({ ...s, sections: [...s.sections, section] }))
      return section
    },
    updateSection: async (sectionId, patch) => {
      update((s) => ({
        ...s,
        sections: s.sections.map((x) => (x.id === sectionId ? { ...x, ...patch } : x)),
      }))
    },
    deleteSection: async (sectionId) => {
      update((s) => ({ ...s, ...removeSection(s, sectionId) }))
    },

    createProduct: async (householdId, input) => {
      const state = read()
      if (!state.sections.some((s) => s.id === input.section_id)) {
        throw new Error('Раздел не найден')
      }
      const product: Product = {
        household_id: householdId,
        is_available: true,
        to_buy: false,
        created_at: now(),
        updated_at: now(),
        created_by: LOCAL_USER.id,
        ...input,
      }
      write({ ...state, products: [...state.products, product] })
      return product
    },
    setProductState: async (productId, state) => {
      update((s) => ({ ...s, ...setProductState(s, productId, state, now()) }))
    },
    deleteProduct: async (productId) => {
      update((s) => ({ ...s, ...removeProduct(s, productId) }))
    },

    createShoppingItem: async (householdId, input) => {
      const item: ShoppingItem = {
        household_id: householdId,
        created_at: now(),
        created_by: LOCAL_USER.id,
        ...input,
      }
      update((s) => ({ ...s, shoppingItems: [...s.shoppingItems, item] }))
      return item
    },
    deleteShoppingItem: async (itemId) => {
      update((s) => ({ ...s, shoppingItems: s.shoppingItems.filter((i) => i.id !== itemId) }))
    },
    purchaseShoppingItem: async (itemId, sectionId, makeStaple) => {
      update((s) => ({
        ...s,
        ...purchaseManualItem(s, itemId, sectionId, makeStaple, {
          newId: crypto.randomUUID(),
          now: now(),
          userId: LOCAL_USER.id,
        }),
      }))
    },

    subscribe: (onChange) => {
      if (typeof window === 'undefined') return () => {}
      const listener = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) onChange()
      }
      window.addEventListener('storage', listener)
      return () => window.removeEventListener('storage', listener)
    },

    resetLocalData: async () => {
      store.removeItem(STORAGE_KEY)
      read()
    },
  }
}
