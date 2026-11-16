import type { Backend } from './backend'
import { createLocalBackend } from './localBackend'
import { createSupabaseBackend } from './supabaseBackend'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Автоматизированный браузер (робот, снимающий превью при выкладке, поисковый
 * обходчик, e2e-тест) не должен заводить настоящего пользователя: каждый его визит
 * оставлял бы в базе анонимную учётную запись. Такие посетители видят демо-режим.
 */
const automated = typeof navigator !== 'undefined' && navigator.webdriver === true

/** Без переменных окружения Supabase приложение работает в локальном демо-режиме. */
export const backend: Backend =
  url && publicKey && !automated ? createSupabaseBackend(url, publicKey) : createLocalBackend()
