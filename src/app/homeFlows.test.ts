import { beforeEach, describe, expect, it } from 'vitest'
import { setLangSetting } from '@/shared/i18n'
import { findProductNamed, groupProductsBySection, PURCHASED, withAvailability, withToBuy } from '@/entities/product'
import { sortSections } from '@/entities/section'
import { buildShoppingList, findShoppingEntryNamed, shoppingEntryName } from '@/entities/shopping-list'
import type { Backend, Product } from '@/shared/api'
import { createLocalBackend } from '@/shared/api/localBackend'

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
      (groupProductsBySection((await snapshot()).products).get(sectionId) ?? []).map((p) => p.name)

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

  it('перетаскивание в покупках: порядок общий для продуктов и ручных позиций', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const add = (name: string) =>
      backend.createProduct(hid, { id: crypto.randomUUID(), section_id: fridge.id, name, icon: null, kind: 'one_off' })
    const milk = await add('Молоко')
    const cheese = await add('Сыр')
    await setToBuy(milk.id, true)
    const batteries = await backend.createShoppingItem(hid, { id: crypto.randomUUID(), name: 'Батарейки', icon: null })
    const names = async () =>
      (await snapshot()).shopping.map((entry) => (entry.type === 'product' ? entry.product.name : entry.item.name))

    expect(await names()).toEqual(['Молоко', 'Батарейки'])

    const stamp = (await product(milk.id)).updated_at
    await backend.reorderShopping([batteries.id, milk.id])
    expect(await names()).toEqual(['Батарейки', 'Молоко'])
    // Перестановка не «обновляет» продукт.
    expect((await product(milk.id)).updated_at).toBe(stamp)

    // Новая строка — в конец; продукт, положенный в покупки заново, прежнее место не занимает.
    await setToBuy(cheese.id, true)
    expect(await names()).toEqual(['Батарейки', 'Молоко', 'Сыр'])
    await setToBuy(milk.id, false)
    await new Promise((resolve) => setTimeout(resolve, 5)) // время добавления в список — с точностью до миллисекунды
    await setToBuy(milk.id, true)
    expect(await names()).toEqual(['Батарейки', 'Сыр', 'Молоко'])
  })

  it('правка продукта: название, иконка и вид меняются, отметки и место в покупках — нет', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const add = (name: string) =>
      backend.createProduct(hid, { id: crypto.randomUUID(), section_id: fridge.id, name, icon: null, kind: 'staple' })
    const milk = await add('Молоко')
    const cheese = await add('Сыр')
    await setAvailable(milk.id, false)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await setAvailable(cheese.id, false)
    const shoppingNames = async () => (await snapshot()).shopping.map(shoppingEntryName)
    expect(await shoppingNames()).toEqual(['Молоко', 'Сыр'])

    const beforeEdit = await product(milk.id)
    await backend.updateProduct(milk.id, { name: 'Молоко 3,2%', icon: '🥛', kind: 'one_off' })
    const edited = await product(milk.id)
    expect(edited).toMatchObject({ name: 'Молоко 3,2%', icon: '🥛', kind: 'one_off', is_available: false, to_buy: true })
    expect(edited.updated_at).toBe(beforeEdit.updated_at)
    // Переименованный продукт не уезжает в конец списка покупок.
    expect(await shoppingNames()).toEqual(['Молоко 3,2%', 'Сыр'])
  })

  it('правка продукта с переездом: в новом разделе он встаёт последним', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const cupboard = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Шкаф', icon: null, sort_order: 1 })
    const add = (sectionId: string, name: string) =>
      backend.createProduct(hid, { id: crypto.randomUUID(), section_id: sectionId, name, icon: null, kind: 'staple' })
    const milk = await add(fridge.id, 'Молоко')
    const rice = await add(cupboard.id, 'Рис')
    const tea = await add(cupboard.id, 'Чай')

    await backend.updateProduct(milk.id, { name: 'Молоко', icon: null, kind: 'staple' })
    await backend.reorderProducts(cupboard.id, [rice.id, tea.id, milk.id])
    const bySection = groupProductsBySection((await snapshot()).products)
    expect(bySection.get(cupboard.id)?.map((p) => p.name)).toEqual(['Рис', 'Чай', 'Молоко'])
    expect(bySection.get(fridge.id)).toBeUndefined()
  })

  it('ручная позиция переименовывается и остаётся на своём месте в списке', async () => {
    const bread = await backend.createShoppingItem(hid, { id: crypto.randomUUID(), name: 'Хлеб', icon: null })
    await new Promise((resolve) => setTimeout(resolve, 5))
    await backend.createShoppingItem(hid, { id: crypto.randomUUID(), name: 'Соль', icon: null })
    await backend.updateShoppingItem(bread.id, { name: 'Хлеб бородинский', icon: '🍞' })
    const state = await snapshot()
    expect(state.shopping.map(shoppingEntryName)).toEqual(['Хлеб бородинский', 'Соль'])
    expect(state.shoppingItems.find((item) => item.id === bread.id)?.icon).toBe('🍞')
  })

  it('дубли названий находятся без учёта регистра и лишних пробелов, а сама запись — не дубль', async () => {
    const fridge = await backend.createSection(hid, { id: crypto.randomUUID(), name: 'Холодильник', icon: null, sort_order: 0 })
    const milk = await backend.createProduct(hid, {
      id: crypto.randomUUID(),
      section_id: fridge.id,
      name: 'Молоко',
      icon: null,
      kind: 'staple',
    })
    await backend.createShoppingItem(hid, { id: crypto.randomUUID(), name: 'Хлеб', icon: null })
    const state = await snapshot()

    expect(findProductNamed(state.products, '  молоко ')?.id).toBe(milk.id)
    expect(findProductNamed(state.products, 'Молоко', milk.id)).toBeUndefined()
    expect(findProductNamed(state.products, 'Молоко топлёное')).toBeUndefined()
    expect(findShoppingEntryNamed(state.shopping, 'ХЛЕБ')).toBeDefined()
    expect(findShoppingEntryNamed(state.shopping, 'Молоко')).toBeUndefined() // продукт дома, но не в покупках
  })

  it('у дома меняются название и аватарка', async () => {
    await backend.updateHousehold(hid, { name: 'Дача', icon: '🏡' })
    expect((await backend.listMemberships())[0].household).toMatchObject({ name: 'Дача', icon: '🏡' })

    await backend.updateHousehold(hid, { name: 'Дача', icon: null })
    expect((await backend.listMemberships())[0].household.icon).toBeNull()
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
