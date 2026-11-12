import { beforeEach, describe, expect, it, vi } from 'vitest'

/* Снимок данных прошлого запуска: то, что человек видит до ответа сервера. */

const KEY = 'home-stock:snapshot'
const MEMBERSHIPS = [{ household: { id: 'h1', name: 'Дом', created_at: '2026-01-01' }, role: 'owner' }]
const PRODUCTS = [{ id: 'p1', name: 'Молоко' }]

function fakeStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  }
}

/** Новый запуск приложения: модули загружаются заново, хранилище устройства остаётся. */
async function launch() {
  vi.resetModules()
  const { queryClient } = await import('./queryClient')
  const snapshot = await import('./snapshot')
  return { queryClient, ...snapshot }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', fakeStorage())
})

describe('снимок данных', () => {
  it('сохраняет данные дома и показывает их при следующем запуске как устаревшие', async () => {
    const first = await launch()
    first.openSnapshot('user-1')
    first.queryClient.setQueryData(['memberships'], MEMBERSHIPS)
    first.queryClient.setQueryData(['hh', 'h1', 'products'], PRODUCTS)
    vi.advanceTimersByTime(1000)

    const second = await launch()
    second.openSnapshot('user-1')
    expect(second.queryClient.getQueryData(['memberships'])).toEqual(MEMBERSHIPS)
    expect(second.queryClient.getQueryData(['hh', 'h1', 'products'])).toEqual(PRODUCTS)
    // Время 0 — признак «это снимок»: такие данные сразу перечитываются с сервера.
    expect(second.queryClient.getQueryState(['memberships'])?.dataUpdatedAt).toBe(0)
  })

  it('не показывает данные другому пользователю и стирает их', async () => {
    const first = await launch()
    first.openSnapshot('user-1')
    first.queryClient.setQueryData(['hh', 'h1', 'products'], PRODUCTS)
    vi.advanceTimersByTime(1000)

    const second = await launch()
    second.openSnapshot('user-2')
    expect(second.queryClient.getQueryData(['hh', 'h1', 'products'])).toBeUndefined()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('стирается при выходе', async () => {
    const app = await launch()
    app.openSnapshot('user-1')
    app.queryClient.setQueryData(['hh', 'h1', 'products'], PRODUCTS)
    vi.advanceTimersByTime(1000)
    expect(localStorage.getItem(KEY)).not.toBeNull()

    app.dropSnapshot()
    app.queryClient.setQueryData(['hh', 'h1', 'products'], [])
    vi.advanceTimersByTime(1000)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('не сохраняет пустой список домов и приглашения', async () => {
    const first = await launch()
    first.openSnapshot('user-1')
    first.queryClient.setQueryData(['memberships'], [])
    first.queryClient.setQueryData(['hh', 'h1', 'invites'], [{ id: 'i1' }])
    vi.advanceTimersByTime(1000)

    const second = await launch()
    second.openSnapshot('user-1')
    expect(second.queryClient.getQueryData(['memberships'])).toBeUndefined()
    expect(second.queryClient.getQueryData(['hh', 'h1', 'invites'])).toBeUndefined()
  })

  it('не затирает данные, которые уже пришли с сервера', async () => {
    const first = await launch()
    first.openSnapshot('user-1')
    first.queryClient.setQueryData(['hh', 'h1', 'products'], PRODUCTS)
    vi.advanceTimersByTime(1000)

    const second = await launch()
    second.queryClient.setQueryData(['hh', 'h1', 'products'], [])
    second.openSnapshot('user-1')
    expect(second.queryClient.getQueryData(['hh', 'h1', 'products'])).toEqual([])
  })
})
