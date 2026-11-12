import { beforeEach, describe, expect, it } from 'vitest'
import { buildShoppingList, groupBySection, PURCHASED, sortSections, withAvailability, withToBuy } from '../domain/logic'
import type { Product } from '../domain/types'
import { setLangSetting } from '../i18n'
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

/** Критерии приёмки MVP из спецификации, проверенные на локальном хранилище. */
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

  const product = async (id: string): Promise<Product> => {
    const found = (await backend.listProducts(hid)).find((p) => p.id === id)
    if (!found) throw new Error('нет такого продукта')
    return found
  }
  /** Нажатие на иконку продукта: закончился или снова дома. */
  const setAvailable = async (id: string, available: boolean) =>
    backend.setProductState(id, withAvailability(await product(id), available))
  /** Плюс и минус на продукте: в покупки или из них. */
  const setToBuy = async (id: string, toBuy: boolean) =>
    backend.setProductState(id, withToBuy(await product(id), toBuy))

  beforeEach(async () => {
    setLangSetting('ru') // демо-набор заводится на языке интерфейса
    backend = createLocalBackend(memoryStore())
    hid = (await backend.listMemberships())[0].household.id
    // Начинаем с пустого дома, чтобы тесты не зависели от демо-набора.
    for (const section of await backend.listSections(hid)) await backend.deleteSection(section.id)
    for (const item of await backend.listShoppingItems(hid)) await backend.deleteShoppingItem(item.id)
  })

  it('создаёт, переименовывает и удаляет раздел', async () => {
    const section = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Шкаф', icon: null, sort_order: 0 })
    await backend.updateSection(section.id, { name: 'Кладовка', icon: '📦' })
    expect((await snapshot()).sections).toMatchObject([{ name: 'Кладовка', icon: '📦' }])
    await backend.deleteSection(section.id)
    expect((await snapshot()).sections).toEqual([])
  })

  it('постоянный продукт: закончился → ровно один раз в покупках → куплен → снова дома', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const milk = await backend.createProduct(hid, {
      id: crypto.randomUUID(),
      section_id: fridge.id,
      name: 'Молоко',
      icon: '🥛',
      kind: 'staple',
    })
    expect((await snapshot()).shopping).toEqual([])

    await setAvailable(milk.id, false)
    await setAvailable(milk.id, false) // повторная отметка не дублирует позицию
    let state = await snapshot()
    expect(state.shopping).toHaveLength(1)
    expect(state.shopping[0]).toMatchObject({ type: 'product', product: { id: milk.id }, section: { id: fridge.id } })
    expect(state.products[0].section_id).toBe(fridge.id) // остаётся в своём разделе

    await backend.setProductState(milk.id, PURCHASED) // «Куплено»
    state = await snapshot()
    expect(state.shopping).toEqual([])
    expect(state.products).toMatchObject([{ id: milk.id, section_id: fridge.id, is_available: true, to_buy: false }])
  })

  it('продукт, который ещё есть дома, можно положить в покупки и убрать из них', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const milk = await backend.createProduct(hid, { id: crypto.randomUUID(), section_id: fridge.id, name: 'Молоко', icon: null, kind: 'staple' })

    await setToBuy(milk.id, true) // плюс: докупить про запас
    let state = await snapshot()
    expect(state.shopping).toMatchObject([{ type: 'product', product: { id: milk.id } }])
    expect(state.products[0]).toMatchObject({ is_available: true, to_buy: true })

    await setToBuy(milk.id, false) // минус: передумали
    state = await snapshot()
    expect(state.shopping).toEqual([])
    expect(state.products[0]).toMatchObject({ is_available: true, to_buy: false })
  })

  it('закончившийся продукт можно не покупать, а появившийся дома уходит из покупок', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const milk = await backend.createProduct(hid, { id: crypto.randomUUID(), section_id: fridge.id, name: 'Молоко', icon: null, kind: 'staple' })

    await setAvailable(milk.id, false)
    await setToBuy(milk.id, false) // закончилось, но покупать не будем
    let state = await snapshot()
    expect(state.shopping).toEqual([])
    expect(state.products[0]).toMatchObject({ is_available: false, to_buy: false })

    await setToBuy(milk.id, true)
    await setAvailable(milk.id, true) // нашлась ещё одна пачка — покупать незачем
    state = await snapshot()
    expect(state.shopping).toEqual([])
    expect(state.products[0]).toMatchObject({ is_available: true, to_buy: false })
  })

  it('докупаемый продукт закончился — остаётся в покупках одной строкой', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const milk = await backend.createProduct(hid, { id: crypto.randomUUID(), section_id: fridge.id, name: 'Молоко', icon: null, kind: 'staple' })
    await setToBuy(milk.id, true)
    await setAvailable(milk.id, false)
    const state = await snapshot()
    expect(state.shopping).toHaveLength(1)
    expect(state.products[0]).toMatchObject({ is_available: false, to_buy: true })
  })

  it('разовый продукт, закончившись, сам в покупки не попадает — только по плюсу', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const berry = await backend.createProduct(hid, {
      id: crypto.randomUUID(),
      section_id: fridge.id,
      name: 'Клубника',
      icon: null,
      kind: 'one_off',
    })
    await setAvailable(berry.id, false)
    let state = await snapshot()
    expect(state.shopping).toEqual([])
    expect(state.products[0]).toMatchObject({ is_available: false, to_buy: false })

    await setToBuy(berry.id, true)
    state = await snapshot()
    expect(state.shopping).toMatchObject([{ type: 'product', product: { id: berry.id } }])

    await backend.setProductState(berry.id, PURCHASED)
    state = await snapshot()
    expect(state.shopping).toEqual([])
    expect(state.products[0]).toMatchObject({ kind: 'one_off', is_available: true, to_buy: false })
  })

  it('ручная покупка без галочки становится разовым продуктом выбранного раздела', async () => {
    const cupboard = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Шкаф', icon: null, sort_order: 0 })
    const bread = await backend.createShoppingItem(hid, { id: crypto.randomUUID(), name: 'Хлеб', icon: '🍞' })
    expect((await snapshot()).shopping).toMatchObject([{ type: 'manual', item: { id: bread.id } }])

    await backend.purchaseShoppingItem(bread.id, cupboard.id, false)
    const state = await snapshot()
    expect(state.shopping).toEqual([])
    expect(state.products).toMatchObject([
      { name: 'Хлеб', icon: '🍞', section_id: cupboard.id, kind: 'one_off', is_available: true },
    ])
  })

  it('ручная покупка с галочкой становится постоянным продуктом и потом сама возвращается в покупки', async () => {
    const cupboard = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Шкаф', icon: null, sort_order: 0 })
    const coffee = await backend.createShoppingItem(hid, { id: crypto.randomUUID(), name: 'Кофе', icon: null })
    await backend.purchaseShoppingItem(coffee.id, cupboard.id, true)

    let state = await snapshot()
    expect(state.products).toMatchObject([{ name: 'Кофе', kind: 'staple', section_id: cupboard.id }])

    await setAvailable(state.products[0].id, false)
    state = await snapshot()
    expect(state.shopping).toMatchObject([{ type: 'product', product: { name: 'Кофе' } }])
  })

  it('покупка в несуществующий раздел ничего не меняет', async () => {
    const bread = await backend.createShoppingItem(hid, { id: crypto.randomUUID(), name: 'Хлеб', icon: null })
    await expect(backend.purchaseShoppingItem(bread.id, 'нет-такого', false)).rejects.toThrow()
    const state = await snapshot()
    expect(state.shoppingItems).toHaveLength(1)
    expect(state.products).toEqual([])
  })

  it('удаление продукта окончательно и убирает его из покупок', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const milk = await backend.createProduct(hid, { id: crypto.randomUUID(), section_id: fridge.id, name: 'Молоко', icon: null, kind: 'staple' })
    await setAvailable(milk.id, false)
    await backend.deleteProduct(milk.id)
    const state = await snapshot()
    expect(state.products).toEqual([])
    expect(state.shopping).toEqual([])
  })

  it('удаление раздела каскадно удаляет продукты и их позиции в покупках, но не ручные покупки', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const cupboard = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Шкаф', icon: null, sort_order: 1 })
    const milk = await backend.createProduct(hid, { id: crypto.randomUUID(), section_id: fridge.id, name: 'Молоко', icon: null, kind: 'staple' })
    await backend.createProduct(hid, { id: crypto.randomUUID(), section_id: fridge.id, name: 'Клубника', icon: null, kind: 'one_off' })
    const rice = await backend.createProduct(hid, { id: crypto.randomUUID(), section_id: cupboard.id, name: 'Рис', icon: null, kind: 'staple' })
    await setAvailable(milk.id, false)
    await setAvailable(rice.id, false)
    await backend.createShoppingItem(hid, { id: crypto.randomUUID(), name: 'Хлеб', icon: null })

    await backend.deleteSection(fridge.id)
    const state = await snapshot()
    expect(state.sections.map((s) => s.name)).toEqual(['Шкаф'])
    expect(state.products.map((p) => p.name)).toEqual(['Рис'])
    expect(state.shopping.map((e) => (e.type === 'product' ? e.product.name : e.item.name)).sort()).toEqual(['Рис', 'Хлеб'])
  })

  it('перетаскивание: порядок в разделе, перенос в другой раздел и порядок разделов', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const cupboard = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Шкаф', icon: null, sort_order: 1 })
    const add = (sectionId: string, name: string) =>
      backend.createProduct(hid, { id: crypto.randomUUID(), section_id: sectionId, name, icon: null, kind: 'staple' })
    const milk = await add(fridge.id, 'Молоко')
    const cheese = await add(fridge.id, 'Сыр')
    const rice = await add(cupboard.id, 'Рис')
    const names = async (sectionId: string) =>
      (groupBySection((await snapshot()).products).get(sectionId) ?? []).map((p) => p.name)

    expect(await names(fridge.id)).toEqual(['Молоко', 'Сыр'])

    await backend.reorderProducts(fridge.id, [cheese.id, milk.id])
    expect(await names(fridge.id)).toEqual(['Сыр', 'Молоко'])

    // Перенос — тот же вызов: продукт из другого раздела стоит в списке.
    await backend.reorderProducts(cupboard.id, [milk.id, rice.id])
    expect(await names(cupboard.id)).toEqual(['Молоко', 'Рис'])
    expect(await names(fridge.id)).toEqual(['Сыр'])

    // Новый продукт встаёт в конец уже переставленного раздела.
    await add(cupboard.id, 'Гречка')
    expect(await names(cupboard.id)).toEqual(['Молоко', 'Рис', 'Гречка'])

    // Перестановка не «обновляет» продукт: по updated_at упорядочен список покупок.
    expect((await product(milk.id)).updated_at).toBe(milk.updated_at)

    await backend.reorderSections([cupboard.id, fridge.id])
    expect(sortSections((await snapshot()).sections).map((s) => s.name)).toEqual(['Шкаф', 'Холодильник'])

    await expect(backend.reorderProducts('нет-такого-раздела', [milk.id])).rejects.toThrow()
  })

  it('демо-набор соответствует макету: молоко закончилось, в покупках три позиции', async () => {
    await backend.resetLocalData?.()
    hid = (await backend.listMemberships())[0].household.id
    const state = await snapshot()
    expect(state.sections.map((s) => s.name)).toEqual(['Холодильник', 'Шкаф', 'Вкусняшки'])
    expect(state.shopping).toHaveLength(3)
  })

  it('демо-набор заводится на языке интерфейса', async () => {
    setLangSetting('ja')
    backend = createLocalBackend(memoryStore())
    hid = (await backend.listMemberships())[0].household.id
    const state = await snapshot()
    expect(state.sections.map((s) => s.name)).toEqual(['冷蔵庫', '戸棚', 'おやつ'])
    setLangSetting('ru')
  })

  it('данные, сохранённые до появления отметки «в покупках», читаются по прежнему правилу', async () => {
    const store = memoryStore()
    backend = createLocalBackend(store)
    hid = (await backend.listMemberships())[0].household.id
    const saved = JSON.parse(store.getItem('home-stock:local:v1')!) as { products: Partial<Product>[] }
    for (const p of saved.products) delete p.to_buy
    store.setItem('home-stock:local:v1', JSON.stringify(saved))

    const state = await snapshot()
    expect(state.products.filter((p) => p.to_buy).map((p) => p.name)).toEqual(['Молоко'])
    expect(state.shopping).toHaveLength(3)
  })
})
