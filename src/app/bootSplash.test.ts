/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { LOADING_KINDS } from '@/shared/lib/loadingKind'
import { LoadingPicture } from '@/shared/ui/LoadingPicture'

const html = readFileSync(join(import.meta.dirname, '../../index.html'), 'utf8')

it('заставка в index.html — те же картинки, что рисует React', () => {
  // Поменяли картинку в LoadingPicture — перенесите её разметку в index.html, иначе при
  // запуске одна картинка сменится другой.
  const pictures = LOADING_KINDS.map((kind) => renderToStaticMarkup(createElement(LoadingPicture, { kind })))
  expect(html).toContain(`<div class="status-note splash boot" data-loading="true">${pictures.join('')}</div>`)
})

it('скрипт index.html выбирает из того же списка картинок', () => {
  expect(html).toContain(`var pictures = [${LOADING_KINDS.map((kind) => `'${kind}'`).join(', ')}]`)
})
