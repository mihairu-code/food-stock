// Рисует 7 иконок приложения (список — src/shared/lib/appIcons.ts): для каждой —
// SVG со скруглением (вкладка браузера, плитка в настройках), квадрат во весь холст
// (PNG для iPhone и Android; iOS скругляет сам) и maskable-вариант с уменьшенным
// рисунком (безопасная зона Android).
//
// node scripts/make-app-icons.mjs <папка>, затем на Mac PNG без сторонних программ:
//   qlmanage -t -s 512 -o <png> <папка>/*.svg      — 512×512
//   sips -z 180 180 x.png --out y.png               — 180 и 192
// Раскладка по public/ — в appIconFiles: у иконки по умолчанию прежние имена в корне,
// у остальных public/icons/<id>.svg, <id>-180/-192/-512/-maskable-512.png.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2]
mkdirSync(out, { recursive: true })

const CREAM = '#fbf6ec'
const INK = '#173f31'
const GREEN = '#2a9d5c'
const DARK = '#1b2623'
const WHITE = '#fffefa'

// Дом: крыша с выступами, труба справа, стены без пола.
const roof = (c, w = 30) =>
  `<path d="M96 254 256 118 416 254" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
// Труба — сплошной столбик, нижний край идёт по скату крыши.
const chimney = (c) =>
  `<path d="M336 186V124H384V227Z" fill="${c}" stroke="${c}" stroke-width="10" stroke-linejoin="round"/>`
const walls = (c, w = 30) =>
  `<path d="M140 232V404M372 232V404" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`
const house = (c) => roof(c) + chimney(c) + walls(c)

// Список: три строки — галочка и черта.
const checklist = (check, line) =>
  [268, 322, 376]
    .map(
      (y) =>
        `<path d="M176 ${y}l14 14 26-30" fill="none" stroke="${check}" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M244 ${y + 1}H336" stroke="${line}" stroke-width="17" stroke-linecap="round"/>`,
    )
    .join('')

const leaf = (x, y, angle, fill, cut, size = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${size})">` +
  `<path d="M0 0C0-44 30-70 74-70 74-26 44 0 0 0Z" fill="${fill}" stroke="${cut}" stroke-width="14" stroke-linejoin="round" paint-order="stroke"/>` +
  `<path d="M6-6 50-48" stroke="${cut}" stroke-width="7" stroke-linecap="round" opacity=".55"/>` +
  `</g>`

const ICONS = {
  // 1. Светлая: тёмно-зелёный дом со списком. Иконка по умолчанию.
  checklist: { bg: CREAM, art: house(INK) + checklist(GREEN, INK) },
  // 7. Тёмный вариант первой.
  checklistDark: { bg: DARK, art: house('#f4eee2') + checklist('#4cc684', '#f4eee2') },
  // 2. Зелёная: белый дом, оранжевая коробка, листок.
  boxLeaf: {
    bg: 'url(#bg)',
    defs: `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f9a62"/><stop offset="1" stop-color="#1d7347"/></linearGradient>`,
    art:
      roof(WHITE) +
      walls(WHITE) +
      `<path d="M256 262 324 296 256 330 188 296Z" fill="#ffc977"/>` +
      `<path d="M188 296 256 330V404L188 370Z" fill="#f4a43e"/>` +
      `<path d="M256 330 324 296V370L256 404Z" fill="#df8a26"/>` +
      leaf(334, 180, -4, '#7fd28f', '#28895a', 1.05),
  },
  // 3. Тёмно-зелёная: белый дом со списком.
  checklistGreen: { bg: '#1e5a41', art: house(WHITE) + checklist(WHITE, WHITE) },
  // 4. Почти чёрная: дом-пятиугольник с галочкой.
  check: {
    bg: DARK,
    art:
      `<path d="M256 124 398 240V386Q398 408 376 408H136Q114 408 114 386V240Z" fill="none" stroke="${WHITE}" stroke-width="30" stroke-linejoin="round"/>` +
      `<path d="M194 308l42 42 82-90" fill="none" stroke="${WHITE}" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  // 5. Светлая: тёмный дом с зелёными плитками.
  grid: {
    bg: CREAM,
    art:
      house(INK) +
      [
        [196, 268],
        [262, 268],
        [196, 334],
        [262, 334],
      ]
        .map(([x, y]) => `<rect x="${x}" y="${y}" width="54" height="54" rx="12" fill="${GREEN}"/>`)
        .join(''),
  },
  // 6. Почти чёрная: белый дом, картонная коробка, листок.
  boxDark: {
    bg: DARK,
    art:
      house(WHITE) +
      `<rect x="190" y="296" width="132" height="108" rx="10" fill="#b68457"/>` +
      `<rect x="180" y="274" width="152" height="38" rx="9" fill="#cf9f6d"/>` +
      `<rect x="234" y="328" width="44" height="12" rx="6" fill="#86603d"/>` +
      leaf(334, 430, -24, '#5fbf6a', DARK, 1.2),
  },
}

const svg = (icon, { rounded, scale }) => {
  const shift = (512 * (1 - scale)) / 2
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
    (icon.defs ? `<defs>${icon.defs}</defs>` : '') +
    `<rect width="512" height="512"${rounded ? ' rx="112"' : ''} fill="${icon.bg}"/>` +
    (scale === 1 ? icon.art : `<g transform="translate(${shift} ${shift}) scale(${scale})">${icon.art}</g>`) +
    `</svg>\n`
  )
}

for (const [name, icon] of Object.entries(ICONS)) {
  writeFileSync(join(out, `${name}.svg`), svg(icon, { rounded: true, scale: 1 }))
  writeFileSync(join(out, `${name}-square.svg`), svg(icon, { rounded: false, scale: 1 }))
  writeFileSync(join(out, `${name}-maskable.svg`), svg(icon, { rounded: false, scale: 0.78 }))
}
