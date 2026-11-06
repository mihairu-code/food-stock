import {
  purchaseManualItem,
  removeProduct,
  removeSection,
  setAvailability,
  type HomeData,
} from '@/domain/logic'
import type { Household, Product, Section, ShoppingItem, User } from '@/domain/types'
import type { Backend } from './backend'

const STORAGE_KEY = 'home-stock:local:v1'
const LOCAL_USER: User = { id: 'local-user', email: null }

interface LocalState extends HomeData {
  household: Household
}

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function seed(): LocalState {
  const now = Date.now()
  const at = (offset: number) => new Date(now + offset).toISOString()
  const hid = crypto.randomUUID()
  const household: Household = { id: hid, name: 'Мой дом', created_at: at(0) }

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

  const fridge = section('Холодильник', '🧊')
  const cupboard = section('Шкаф', '🧺')
  const treats = section('Вкусняшки', '🍪')

  return {
    household,
    sections: [fridge, cupboard, treats],
    products: [
      product(fridge, 'Молоко', '🥛', 'staple', false),
      product(fridge, 'Яйца', '🥚', 'staple'),
      product(fridge, 'Сыр', '🧀', 'staple'),
      product(fridge, 'Клубника', '🍓', 'one_off'),
      product(cupboard, 'Кофе', '☕', 'staple'),
      product(cupboard, 'Рис', '🍚', 'staple'),
      product(treats, 'Шоколад', '🍫', 'one_off'),
    ],
    shoppingItems: [item('Кофе в зёрнах', '🫘'), item('Хлеб', '🍞')],
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
        return JSON.parse(raw) as LocalState
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

  return {
    mode: 'local',

    currentUser: async () => LOCAL_USER,
    listMemberships: async () => [{ household: read().household, role: 'owner' }],

    listSections: async () => read().sections,
    listProducts: async () => read().products,
    listShoppingItems: async () => read().shoppingItems,

    createSection: async (householdId, input) => {
      const section: Section = {
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
        household_id: householdId,
        is_available: true,
        created_at: now(),
        updated_at: now(),
        created_by: LOCAL_USER.id,
        ...input,
      }
      write({ ...state, products: [...state.products, product] })
      return product
    },
    setAvailability: async (productId, available) => {
      update((s) => ({ ...s, ...setAvailability(s, productId, available, now()) }))
    },
    deleteProduct: async (productId) => {
      update((s) => ({ ...s, ...removeProduct(s, productId) }))
    },

    createShoppingItem: async (householdId, input) => {
      const item: ShoppingItem = {
        id: crypto.randomUUID(),
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
