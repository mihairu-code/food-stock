/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')

interface VercelConfig {
  headers: { source: string; headers: { key: string; value: string }[] }[]
}

const headers = (JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')) as VercelConfig).headers[0].headers
const header = (key: string) => headers.find((entry) => entry.key === key)?.value ?? ''

describe('заголовки безопасности на Vercel', () => {
  it('CSP разрешает встроенный скрипт темы из index.html — и только его', () => {
    // Скрипт выставляет тему до первой отрисовки. Поменяли его — поменяйте хеш в vercel.json,
    // иначе после выкладки браузер его заблокирует и экран мигнёт чужой темой.
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1])
    expect(inline).toHaveLength(1)
    const hash = `'sha256-${createHash('sha256').update(inline[0]).digest('base64')}'`
    expect(header('Content-Security-Policy')).toContain(`script-src 'self' ${hash};`)
  })

  it('данные ходят только к Supabase, страницу нельзя встроить во фрейм', () => {
    const csp = header('Content-Security-Policy')
    expect(csp).toContain("connect-src 'self' https://*.supabase.co wss://*.supabase.co;")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(header('X-Content-Type-Options')).toBe('nosniff')
  })
})
