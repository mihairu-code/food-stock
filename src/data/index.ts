import type { Backend } from './backend'
import { createLocalBackend } from './localBackend'

/** Пока сервера нет, приложение работает в локальном демо-режиме. */
export const backend: Backend = createLocalBackend()
