/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { LoadingPicture } from '@/shared/ui/LoadingPicture'

it('заставка в index.html — тот же холодильник, что рисует React', () => {
  // Поменяли картинку в LoadingPicture — перенесите её разметку в index.html, иначе при
  // запуске холодильник сменится другим.
  const html = readFileSync(join(import.meta.dirname, '../../index.html'), 'utf8')
  const fridge = renderToStaticMarkup(createElement(LoadingPicture, { kind: 'fridge' }))
  expect(html).toContain(`<div class="status-note splash boot" data-loading="true">${fridge}</div>`)
})
