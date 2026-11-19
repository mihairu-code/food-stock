/// <reference types="node" />
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { APP_ICONS, appIconFiles } from './appIcons'

const PUBLIC = join(import.meta.dirname, '../../../public')

describe('иконки приложения', () => {
  // Пропавшая картинка видна только на телефоне при установке — ловим её здесь.
  it.each(APP_ICONS)('у иконки %s есть все картинки и плитка для настроек', (icon) => {
    const { manifest: _manifest, ...images } = appIconFiles(icon)
    for (const file of [...Object.values(images), `icons/${icon}.svg`]) {
      expect(existsSync(join(PUBLIC, file)), file).toBe(true)
    }
  })
})
