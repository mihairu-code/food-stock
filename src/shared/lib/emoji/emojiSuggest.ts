/**
 * Подбор эмодзи по названию продукта — на русском, английском, японском и вьетнамском.
 *
 * Если точной иконки нет, показываются соседи по группе: для «сухариков» — другие снеки.
 * Языки устроены по-разному, поэтому у каждого словаря свой способ сравнения:
 *   stem   — основы слов («молок», «сухар»): падежи и уменьшительные формы находятся сами;
 *   plural — слово и его множественное число (английский: «egg» — это eggs, но не eggplant);
 *   word   — слово или словосочетание целиком (вьетнамский: «sữa chua» — йогурт, не молоко);
 *   sub    — вхождение в любом месте (японский: слова пишутся без пробелов).
 */

import {
  EN_GROUPS,
  EN_ITEMS,
  JA_GROUPS,
  JA_ITEMS,
  VI_GROUPS,
  VI_ITEMS,
  type Group,
  type GroupWords,
  type Item,
} from './emojiWords'

/* Русский: основы слов, чтобы находились падежи и уменьшительные формы. */
const RU_ITEMS: Item[] = [
  ['🥛', 'dairy', 'молок', 'молоч', 'кефир', 'ряженк', 'сливк', 'простокваш', 'айран'],
  ['🧀', 'dairy', 'сыр', 'сырок', 'сырк', 'моцарел', 'пармезан', 'брынз', 'фет', 'творож'],
  ['🧈', 'dairy', 'масл', 'маргарин'],
  ['🥚', 'dairy', 'яйц', 'яиц', 'яичк'],
  ['🥣', 'dairy', 'йогурт', 'творог', 'сметан'],
  ['🍦', 'dairy', 'морожен', 'пломбир', 'эскимо'],

  ['🍞', 'bakery', 'хлеб', 'батон', 'булк', 'булоч', 'тост'],
  ['🥖', 'bakery', 'багет'],
  ['🥐', 'bakery', 'круасан', 'слойк'],
  ['🫓', 'bakery', 'лаваш', 'лепешк', 'пита'],
  ['🥯', 'bakery', 'бублик', 'бейгл'],
  ['🥞', 'bakery', 'блин', 'оладь', 'сырник'],
  ['🧇', 'bakery', 'вафл'],
  ['🥧', 'bakery', 'пирог', 'пирож'],

  ['🥩', 'meat', 'мяс', 'говядин', 'свинин', 'стейк', 'фарш', 'баранин', 'телятин', 'вырезк'],
  ['🍗', 'meat', 'кур', 'куриц', 'курин', 'куроч', 'индейк', 'филе', 'грудк', 'окорочк', 'крылышк', 'бедр'],
  ['🥓', 'meat', 'бекон', 'грудинк', 'сало'],
  ['🌭', 'meat', 'сосиск', 'сардельк', 'колбас'],
  ['🍖', 'meat', 'ветчин', 'ребрышк', 'шашлык', 'буженин'],

  ['🐟', 'fish', 'рыб', 'лосос', 'семг', 'форел', 'треск', 'сельд', 'селедк', 'скумбри', 'минта', 'тунец', 'тунц', 'горбуш'],
  ['🦐', 'fish', 'креветк', 'морепродукт'],
  ['🦑', 'fish', 'кальмар'],
  ['🦀', 'fish', 'краб'],
  ['🍣', 'fish', 'суши', 'ролл'],
  ['🥫', 'fish', 'консерв', 'тушенк', 'шпрот'],

  ['🍎', 'fruit', 'яблок', 'яблоч'],
  ['🍌', 'fruit', 'банан'],
  ['🍊', 'fruit', 'апельсин', 'мандарин', 'грейпфрут'],
  ['🍋', 'fruit', 'лимон', 'лайм'],
  ['🍐', 'fruit', 'груш'],
  ['🍇', 'fruit', 'виноград', 'изюм'],
  ['🍓', 'fruit', 'клубник', 'земляник', 'малин'],
  ['🫐', 'fruit', 'черник', 'голубик', 'ягод', 'смородин', 'клюкв'],
  ['🍒', 'fruit', 'вишн', 'черешн'],
  ['🍑', 'fruit', 'персик', 'абрикос', 'нектарин', 'кураг', 'слив'],
  ['🍉', 'fruit', 'арбуз'],
  ['🍈', 'fruit', 'дын'],
  ['🍍', 'fruit', 'ананас'],
  ['🥭', 'fruit', 'манго'],
  ['🥝', 'fruit', 'киви'],
  ['🥥', 'fruit', 'кокос'],

  ['🥔', 'veg', 'картош', 'картоф'],
  ['🥕', 'veg', 'морков'],
  ['🍅', 'veg', 'помидор', 'томат', 'черри'],
  ['🥒', 'veg', 'огурц', 'огурец', 'огурч', 'кабач', 'цукини'],
  ['🧅', 'veg', 'лук', 'луков'],
  ['🧄', 'veg', 'чеснок', 'чесноч'],
  ['🫑', 'veg', 'перец', 'перц', 'паприк'],
  ['🥬', 'veg', 'капуст', 'салат', 'зелен', 'шпинат', 'руккол', 'укроп', 'петрушк', 'кинз'],
  ['🥦', 'veg', 'брокколи', 'цветн'],
  ['🌽', 'veg', 'кукуруз'],
  ['🍆', 'veg', 'баклажан'],
  ['🥑', 'veg', 'авокадо'],
  ['🍄', 'veg', 'гриб', 'шампиньон', 'вешенк'],
  ['🎃', 'veg', 'тыкв'],
  ['🫘', 'veg', 'фасол', 'чечевиц', 'нут', 'горох', 'горошек', 'бобы'],

  ['🍚', 'grain', 'рис', 'круп', 'гречк', 'гречн', 'булгур', 'перловк', 'пшен', 'кускус', 'киноа'],
  ['🍝', 'grain', 'макарон', 'спагетти', 'паста', 'пасты', 'лапш', 'вермишел'],
  ['🥣', 'grain', 'каш', 'овсянк', 'овсян', 'хлопь', 'мюсли', 'гранол'],
  ['🌾', 'grain', 'мука', 'муки', 'муку', 'отруб'],

  ['💧', 'drink', 'вод', 'минералк'],
  ['🧃', 'drink', 'сок', 'морс', 'компот', 'нектар'],
  ['🥤', 'drink', 'газировк', 'лимонад', 'кол', 'напит', 'квас', 'энергетик'],
  ['☕', 'drink', 'кофе', 'капсул'],
  ['🍵', 'drink', 'чай', 'чая', 'заварк'],
  ['🧋', 'drink', 'какао', 'коктейл'],

  ['🍺', 'alcohol', 'пив', 'сидр'],
  ['🍷', 'alcohol', 'вин'],
  ['🥂', 'alcohol', 'шампанск', 'игрист', 'просекко'],
  ['🥃', 'alcohol', 'виски', 'коньяк', 'водк', 'ром', 'джин'],

  ['🍫', 'sweet', 'шоколад', 'батончик'],
  ['🍬', 'sweet', 'конфет', 'леденц', 'карамел', 'сахар', 'мармелад', 'зефир'],
  ['🍪', 'sweet', 'печень', 'пряник'],
  ['🍯', 'sweet', 'мед', 'медов', 'варень', 'джем', 'сироп', 'сгущенк'],
  ['🍰', 'sweet', 'торт', 'пирожн', 'чизкейк', 'рулет'],
  ['🧁', 'sweet', 'кекс', 'маффин', 'капкейк'],
  ['🍩', 'sweet', 'пончик'],
  ['🍮', 'sweet', 'пудинг', 'желе'],

  ['🥨', 'snack', 'сухар', 'сушк', 'крекер', 'соломк', 'крендел', 'снек'],
  ['🍟', 'snack', 'чипс', 'фри'],
  ['🥜', 'snack', 'орех', 'ореш', 'арахис', 'миндал', 'фисташк', 'кешью', 'фундук', 'семечк'],
  ['🍿', 'snack', 'попкорн'],
  ['🍘', 'snack', 'хлебц'],

  ['🧂', 'sauce', 'сол', 'специ', 'приправ'],
  ['🫒', 'sauce', 'оливк', 'маслин'],
  ['🍅', 'sauce', 'кетчуп'],
  ['🥫', 'sauce', 'соус', 'майонез', 'горчиц', 'аджик'],
  ['🍶', 'sauce', 'уксус', 'соев'],

  ['🥟', 'ready', 'пельмен', 'вареник', 'хинкал', 'манты'],
  ['🍕', 'ready', 'пицц'],
  ['🍔', 'ready', 'бургер', 'котлет'],
  ['🥪', 'ready', 'сэндвич', 'сендвич', 'бутерброд'],
  ['🍲', 'ready', 'суп', 'борщ', 'бульон'],
  ['🥗', 'ready', 'винегрет', 'оливье'],
  ['🧊', 'ready', 'лед', 'заморож', 'заморозк'],

  ['🧻', 'home', 'туалетн', 'бумаг', 'салфетк', 'полотенц'],
  ['🧼', 'home', 'мыл'],
  ['🧴', 'home', 'шампун', 'гель', 'крем', 'средств', 'кондиционер', 'бальзам'],
  ['🧽', 'home', 'губк'],
  ['🪥', 'home', 'зубн', 'щетк'],
  ['🧺', 'home', 'порошок', 'порошк', 'стирк'],
  ['🗑️', 'home', 'мешк', 'пакет'],
  ['🐈', 'home', 'корм', 'кошач', 'наполнител'],
  ['👶', 'home', 'подгузник', 'памперс', 'детск'],
  ['💊', 'home', 'лекарств', 'таблетк', 'витамин'],
  ['🔋', 'home', 'батарейк'],
  ['💡', 'home', 'лампочк'],
]

const RU_GROUPS: GroupWords[] = [
  ['dairy', 'молочк', 'молочн'],
  ['bakery', 'выпечк'],
  ['meat', 'мясн'],
  ['fish', 'рыбн'],
  ['fruit', 'фрукт'],
  ['veg', 'овощ'],
  ['grain', 'бакале'],
  ['drink', 'напитк', 'напиток'],
  ['alcohol', 'алкогол'],
  ['sweet', 'сладк', 'сладост', 'десерт'],
  ['snack', 'снек', 'закуск', 'перекус'],
  ['sauce', 'соус', 'приправ'],
  ['ready', 'полуфабрикат', 'заморозк'],
  ['home', 'бытов', 'хими', 'гигиен'],
]

/** Что показывать, пока название пустое или ничего не нашлось. */
const DEFAULTS = ['🥛', '🍞', '🥚', '🧀', '🍎', '🥔', '🍗', '🍚', '🍫', '☕', '🧻']

export interface EmojiSuggestion {
  /** Иконки для быстрого выбора, самые подходящие первыми. */
  options: string[]
  /** Уверенное совпадение, которое можно подставить без выбора; иначе null. */
  best: string | null
}

export interface SuggestOptions {
  limit?: number
  /** Язык интерфейса: его словарь получает небольшое преимущество при равных совпадениях. */
  lang?: string
}

/** Нижний регистр, «ё» как «е», катакана как хирагана, знаки препинания — в пробелы. */
const normalize = (text: string) =>
  text
    .normalize('NFC')
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/** Латиница без диакритики: «sữa» → «sua». Так вьетнамское название набирают без знаков. */
const stripMarks = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replaceAll('đ', 'd')

type Mode = 'stem' | 'plural' | 'word' | 'sub'

interface Entry {
  /** null — слово называет группу целиком, а не продукт. */
  emoji: string | null
  group: Group
  word: string
  /** Слово без диакритики; отличается от word только во вьетнамском. */
  plain: string
  phrase: boolean
}

interface Dictionary {
  lang: string
  mode: Mode
  entries: Entry[]
}

function dictionary(lang: string, mode: Mode, items: Item[], groups: GroupWords[]): Dictionary {
  const entry = (emoji: string | null, group: Group, raw: string): Entry => {
    const word = normalize(raw)
    return { emoji, group, word, plain: stripMarks(word), phrase: word.includes(' ') }
  }
  return {
    lang,
    mode,
    entries: [
      ...items.flatMap(([emoji, group, ...words]) => words.map((word) => entry(emoji, group, word))),
      ...groups.flatMap(([group, ...words]) => words.map((word) => entry(null, group, word))),
    ],
  }
}

const DICTIONARIES: Dictionary[] = [
  dictionary('ru', 'stem', RU_ITEMS, RU_GROUPS),
  dictionary('en', 'plural', EN_ITEMS, EN_GROUPS),
  dictionary('ja', 'sub', JA_ITEMS, JA_GROUPS),
  dictionary('vi', 'word', VI_ITEMS, VI_GROUPS),
]

/** Порядок показа соседей по группе: сначала русский список, новые иконки других языков — следом. */
const GROUP_ORDER: [string, Group][] = []
for (const [emoji, group] of [...RU_ITEMS, ...EN_ITEMS, ...JA_ITEMS, ...VI_ITEMS]) {
  if (!GROUP_ORDER.some(([e, g]) => e === emoji && g === group)) GROUP_ORDER.push([emoji, group])
}

/** Расстояние Левенштейна не больше 1 — одна опечатка. */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1)
  const [long, short] = a.length > b.length ? [a, b] : [b, a]
  return long.slice(i + 1) === short.slice(i)
}

const EXACT = 100
/** Первое слово названия важнее уточнений: «масло оливковое» — это прежде всего масло. */
const FIRST_WORD_BONUS = 20
/** Преимущество словаря на языке интерфейса. */
const LANG_BONUS = 3

/** Насколько слово из названия подходит к основе из словаря; 0 — не подходит. */
function stemScore(word: string, stem: string): number {
  if (word.startsWith(stem)) {
    // Короткая основа («кол», «вин», «egg») не должна цеплять длинные чужие слова
    // («колбаса», «виноград», «eggplant»).
    if (stem.length <= 3 && word.length > stem.length + 3) return 0
    return EXACT + stem.length
  }
  // Название ещё набирают: «мо» → молоко, морковь, мороженое.
  if (word.length >= 2 && stem.startsWith(word)) return 50 + word.length
  return 0
}

const EN_ENDINGS = new Set(['', 's', 'es', 'y', 'ies'])

/** Английское слово: само, во множественном числе («tomatoes») или с «-y/-ies» («strawberries»). */
function pluralScore(word: string, stem: string): number {
  if (word.startsWith(stem) && EN_ENDINGS.has(word.slice(stem.length))) return EXACT + stem.length
  if (word.length >= 2 && stem.startsWith(word)) return 50 + word.length
  return 0
}

/** Запасной вариант, когда слово не нашлось: одна опечатка в начале («малоко»). */
function typoScore(word: string, stem: string): number {
  if (stem.length < 4 || word.length < stem.length - 1) return 0
  for (const cut of [stem.length, stem.length + 1, stem.length - 1]) {
    if (cut <= word.length && withinOneEdit(word.slice(0, cut), stem)) return 20 + stem.length
  }
  return 0
}

/**
 * Где в тексте стоит слово или словосочетание; -1 — нигде. Начало всегда на границе слова;
 * конец — тоже (whole) либо где угодно («ice cream» найдётся и в «ice creams»).
 */
function findPhrase(text: string, phrase: string, whole: boolean): number {
  let from = 0
  for (;;) {
    const at = text.indexOf(phrase, from)
    if (at < 0) return -1
    const end = at + phrase.length
    const startsWord = at === 0 || text[at - 1] === ' '
    const endsWord = end === text.length || text[end] === ' '
    if (startsWord && (endsWord || !whole)) return at
    from = at + 1
  }
}

interface Hit {
  score: number
  /** Совпало начало названия целиком — такую иконку можно подставить без выбора. */
  confident: boolean
}

const at = (position: number, length: number, penalty = 0): Hit => ({
  score: EXACT + length - penalty + (position === 0 ? FIRST_WORD_BONUS : 0),
  confident: position === 0,
})
const typing = (text: string): Hit => ({ score: 50 + text.length, confident: false })

export function suggestEmojis(name: string, { limit = 11, lang }: SuggestOptions = {}): EmojiSuggestion {
  const text = normalize(name)
  if (!text) return { options: DEFAULTS.slice(0, limit), best: null }

  const plain = stripMarks(text)
  const typedPlain = text === plain
  // Числа и обозначения («2», «b12») словами не считаются: «2 молока» начинается с молока.
  const words = text.split(' ').filter((word) => /^[a-zа-я]+$/.test(word))
  const cjk = /[぀-ヿ㐀-鿿]/.test(text)

  const scores = new Map<string, number>()
  const groupScores = new Map<Group, number>()
  const bump = <K>(map: Map<K, number>, key: K, score: number) => {
    if (score > (map.get(key) ?? 0)) map.set(key, score)
  }
  let confident = false

  const record = (entry: Entry, hit: Hit, bonus: number) => {
    if (hit.score === 0) return false
    if (entry.emoji) {
      bump(scores, entry.emoji, hit.score + bonus)
      bump(groupScores, entry.group, hit.score + bonus)
      if (hit.confident) confident = true
    } else {
      bump(groupScores, entry.group, hit.score + bonus - 1)
    }
    return true
  }

  for (const dict of DICTIONARIES) {
    const bonus = dict.lang === lang ? LANG_BONUS : 0

    if (dict.mode === 'sub') {
      if (!cjk) continue
      for (const entry of dict.entries) {
        const position = text.indexOf(entry.word)
        if (position >= 0) record(entry, at(position, entry.word.length), bonus)
        else if (entry.word.startsWith(text)) record(entry, typing(text), bonus)
      }
      continue
    }

    if (dict.mode === 'word') {
      // Вне вьетнамского интерфейса работают только слова с диакритикой: «cam», «pin»
      // или «hat» в английском названии — не вьетнамские апельсин, батарейка и орехи.
      const native = dict.lang === lang
      for (const entry of dict.entries) {
        const marked = entry.word !== entry.plain
        if (!native && !marked) continue
        const position = findPhrase(text, entry.word, true)
        if (position >= 0) {
          record(entry, at(position, entry.word.length), bonus)
        } else if (native && typedPlain && marked) {
          // Название набрано без знаков: «sua chua». Совпадение менее надёжно — «bo» это
          // и масло (bơ), и говядина (bò), — поэтому само в поле не подставляется.
          const loose = findPhrase(plain, entry.plain, true)
          if (loose >= 0) record(entry, { ...at(loose, entry.word.length, 3), confident: false }, bonus)
          else if (plain.length >= 2 && entry.plain.startsWith(plain)) record(entry, typing(text), bonus)
        } else if ((native || !typedPlain) && text.length >= 2 && entry.word.startsWith(text)) {
          record(entry, typing(text), bonus)
        }
      }
      continue
    }

    // Основы слов. Словосочетания сверяются со всем названием, остальное — по словам.
    for (const entry of dict.entries) {
      if (!entry.phrase) continue
      const position = findPhrase(text, entry.word, false)
      if (position >= 0) record(entry, at(position, entry.word.length), bonus)
      else if (text.length >= 2 && entry.word.startsWith(text)) record(entry, typing(text), bonus)
    }
    const exactScore = dict.mode === 'plural' ? pluralScore : stemScore
    words.forEach((word, index) => {
      const collect = (score: (word: string, stem: string) => number) => {
        let found = false
        for (const entry of dict.entries) {
          if (entry.phrase) continue
          const value = score(word, entry.word)
          if (value === 0) continue
          const hit: Hit = {
            score: value + (index === 0 ? FIRST_WORD_BONUS : 0),
            confident: value >= EXACT && index === 0,
          }
          if (record(entry, hit, bonus)) found = true
        }
        return found
      }
      if (!collect(exactScore)) collect(typoScore)
    })
  }

  const byScore = <K>(map: Map<K, number>) => [...map].sort((a, b) => b[1] - a[1])
  const direct = byScore(scores)
  const options = direct.map(([emoji]) => emoji)

  // Добираем соседями по группе, начиная с самой подходящей.
  for (const [group] of byScore(groupScores)) {
    for (const [emoji, itemGroup] of GROUP_ORDER) {
      if (itemGroup === group && !options.includes(emoji)) options.push(emoji)
    }
  }
  for (const emoji of DEFAULTS) {
    if (!options.includes(emoji)) options.push(emoji)
  }

  return {
    options: options.slice(0, limit),
    // Подставляем сами, только если начало названия нашлось в словаре целиком.
    best: confident && direct.length > 0 ? direct[0][0] : null,
  }
}
