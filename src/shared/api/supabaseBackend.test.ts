import { beforeEach, expect, it, vi } from 'vitest'

/*
 * Что Supabase-хранилище отправляет в базу. Сам Supabase здесь подменён: запись в таблицу
 * запоминается и возвращается как строка. Правила базы проверяет supabase/tests.
 */

const inserted: { table: string; row: Record<string, unknown> }[] = []

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => {
        inserted.push({ table, row })
        return { select: () => ({ single: async () => ({ data: row, error: null }) }) }
      },
    }),
  }),
}))

const { createSupabaseBackend } = await import('./supabaseBackend')

beforeEach(() => {
  inserted.length = 0
})

it('новый продукт уходит с kind = staple: прежние версии ведут его как постоянный', async () => {
  const backend = createSupabaseBackend('https://example.test', 'public-key')
  await backend.createProduct('h1', { id: 'p1', section_id: 's1', name: 'Молоко', icon: null })
  expect(inserted).toEqual([
    { table: 'products', row: { household_id: 'h1', kind: 'staple', id: 'p1', section_id: 's1', name: 'Молоко', icon: null } },
  ])
})

it('у раздела нет kind', async () => {
  const backend = createSupabaseBackend('https://example.test', 'public-key')
  await backend.createSection('h1', { id: 's1', name: 'Шкаф', icon: null, sort_order: 0 })
  expect(inserted).toEqual([
    { table: 'sections', row: { household_id: 'h1', id: 's1', name: 'Шкаф', icon: null, sort_order: 0 } },
  ])
})
