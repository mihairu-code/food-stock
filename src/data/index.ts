import type { Backend } from './backend'
import { createLocalBackend } from './localBackend'
import { createSupabaseBackend } from './supabaseBackend'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Без переменных окружения Supabase приложение работает в локальном демо-режиме. */
export const backend: Backend = url && publicKey ? createSupabaseBackend(url, publicKey) : createLocalBackend()
