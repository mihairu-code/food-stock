import { beforeEach, describe, expect, it } from 'vitest'
import { buildShoppingList, sortSections } from '../domain/logic'
import type { Backend } from './backend'
import { createLocalBackend } from './localBackend'

function memoryStore() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  }
}

/** Критерии приёмки MVP, проверенные на локальном хранилище. */
describe('домашние запасы: основные потоки', () => {
  let backend: Backend
  let hid: string

  async function snapshot() {
    const [sections, products, shoppingItems] = await Promise.all([
      backend.listSections(hid),
      backend.listProducts(hid),
      backend.listShoppingItems(hid),
    ])
    return { sections, products, shoppingItems, shopping: buildShoppingList({ sections, products, shoppingItems }) }
  }

  beforeEach(async () => {
    backend = createLocalBackend(memoryStore())
    hid = (await backend.listMemberships())[0].household.id
    // Начинаем с пустого дома, чтобы тесты не зависели от демо-набора.
    for (const section of await backend.listSections(hid)) await backend.deleteSection(section.id)
    for (const item of await backend.listShoppingItems(hid)) await backend.deleteShoppingItem(item.id)
  })

  it('создаёт, переименовывает и удаляет раздел', async () => {
    const section = await backend.createSection(hid, { name: 'Шкаф', icon: null, sort_order: 0 })
    await backend.updateSection(section.id, { name: 'Кладовка', icon: '📦' })
    expect((await snapshot()).sections).toMatchObject([{ name: 'Кладовка', icon: '📦' }])
    await backend.deleteSection(section.id)
    expect((await snapshot()).sections).toEqual([])
  })

  it('разделы идут по sort_order', async () => {
    await backend.createSection(hid, { name: 'Второй', icon: null, sort_order: 2 })
    await backend.createSection(hid, { name: 'Первый', icon: null, sort_order: 1 })
    expect(sortSections((await snapshot()).sections).map((s) => s.name)).toEqual(['Первый', 'Второй'])
  })

  it('постоянный продукт: закончился → ровно один раз в покупках → куплен → снова дома', async () => {
    const fridge = await backend.createSection(hid, { name: 'Холодильник', icon: null, sort_order: 0 })
    const milk = await backend.createProduct(hid, { section_id: fridge.id, name: 'Молоко', icon: '🥛', kind: 'staple' })
    expect((await snapshot()).shopping).toEqual([])

    await backend.setAvailability(milk.id, false)
    await backend.setAvailability(milk.id, false) // повторная отметка не дублирует позицию
    let state = await snapshot()
    expect(state.shopping).toHaveLength(1)
    expect(state.shopping[0]).toMatchObject({ type: 'product', product: { id: milk.id }, section: { id: fridge.id } })
    expect(state.products[0].section_id).toBe(fridge.id) // остаётся в своём разделе

    await backend.setAvailability(milk.id, true) // «Куплено»
    state = await snapshot()
    expect(state.shopping).toEqual([])
    expect(state.products[0]).toMatchObject({ is_available: true, section_id: fridge.id })
  })

  it('разовый продукт нельзя отметить закончившимся — только удалить', async () => {
    const fridge = await backend.createSection(hid, { name: 'Холодильник', icon: null, sort_order: 0 })
    const cake = await backend.createProduct(hid, { section_id: fridge.id, name: 'Торт', icon: '🎂', kind: 'one_off' })
    await expect(backend.setAvailability(cake.id, false)).rejects.toThrow()
    await backend.deleteProduct(cake.id)
    expect((await snapshot()).products).toEqual([])
  })

  it('ручная позиция: куплена без галочки → разовый продукт в выбранном разделе', async () => {
    const cupboard = await backend.createSection(hid, { name: 'Шкаф', icon: null, sort_order: 0 })
    const item = await backend.createShoppingItem(hid, { name: 'Батарейки', icon: '🔋' })
    expect((await snapshot()).shopping).toMatchObject([{ type: 'manual', item: { id: item.id } }])

    await backend.purchaseShoppingItem(item.id, cupboard.id, false)
    const state = await snapshot()
    expect(state.shopping).toEqual([])
    expect(state.products).toMatchObject([
      { name: 'Батарейки', icon: '🔋', kind: 'one_off', is_available: true, section_id: cupboard.id },
    ])
  })

  it('ручная позиция: куплена с галочкой → постоянный продукт', async () => {
    const cupboard = await backend.createSection(hid, { name: 'Шкаф', icon: null, sort_order: 0 })
    const item = await backend.createShoppingItem(hid, { name: 'Чай', icon: null })
    await backend.purchaseShoppingItem(item.id, cupboard.id, true)
    expect((await snapshot()).products).toMatchObject([{ name: 'Чай', kind: 'staple' }])
  })

  it('удаление продукта убирает его и из покупок', async () => {
    const fridge = await backend.createSection(hid, { name: 'Холодильник', icon: null, sort_order: 0 })
    const milk = await backend.createProduct(hid, { section_id: fridge.id, name: 'Молоко', icon: null, kind: 'staple' })
    await backend.setAvailability(milk.id, false)
    await backend.deleteProduct(milk.id)
    expect((await snapshot()).shopping).toEqual([])
  })

  it('удаление раздела удаляет его продукты, ручные покупки остаются', async () => {
    const fridge = await backend.createSection(hid, { name: 'Холодильник', icon: null, sort_order: 0 })
    const milk = await backend.createProduct(hid, { section_id: fridge.id, name: 'Молоко', icon: null, kind: 'staple' })
    await backend.setAvailability(milk.id, false)
    await backend.createShoppingItem(hid, { name: 'Хлеб', icon: null })

    await backend.deleteSection(fridge.id)
    const state = await snapshot()
    expect(state.products).toEqual([])
    expect(state.shopping).toMatchObject([{ type: 'manual', item: { name: 'Хлеб' } }])
  })

  it('покупка в несуществующий раздел не теряет позицию', async () => {
    const item = await backend.createShoppingItem(hid, { name: 'Хлеб', icon: null })
    await expect(backend.purchaseShoppingItem(item.id, 'нет-такого', false)).rejects.toThrow()
    expect((await snapshot()).shoppingItems).toMatchObject([{ id: item.id }])
  })

  it('сброс возвращает демо-набор', async () => {
    await backend.resetLocalData?.()
    const state = await snapshot()
    expect(state.sections.length).toBeGreaterThan(0)
    expect(state.shopping.length).toBeGreaterThan(0)
  })
})
