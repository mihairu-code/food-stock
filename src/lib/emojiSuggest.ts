/**
 * Подбор эмодзи по названию продукта.
 *
 * Если точной иконки нет, показываются соседи по группе: для «сухариков» — другие снеки.
 * Словарь хранит основы слов («молок», «сухар»), поэтому падежи и уменьшительные формы
 * находятся сами, а одна опечатка прощается.
 */

type Group =
  | 'dairy'
  | 'bakery'
  | 'meat'
  | 'fish'
  | 'fruit'
  | 'veg'
  | 'grain'
  | 'drink'
  | 'alcohol'
  | 'sweet'
  | 'snack'
  | 'sauce'
  | 'ready'
  | 'home'

/** [эмодзи, группа, ...слова]. Порядок внутри группы — порядок показа. */
type Item = [emoji: string, group: Group, ...words: string[]]
/** Слова, которые называют группу целиком: «снеки», «фрукты». */
type GroupWords = [group: Group, ...words: string[]]

/* Русский: основы слов, чтобы находились падежи и уменьшительные формы. */
const ITEMS: Item[] = [
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

const GROUPS: GroupWords[] = [
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

/** Нижний регистр, «ё» как «е», знаки препинания — в пробелы. */
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

interface Entry {
  /** null — слово называет группу целиком, а не продукт. */
  emoji: string | null
  group: Group
  word: string
}

const ENTRIES: Entry[] = [
  ...ITEMS.flatMap(([emoji, group, ...stems]) => stems.map((word) => ({ emoji, group, word }))),
  ...GROUPS.flatMap(([group, ...stems]) => stems.map((word) => ({ emoji: null, group, word }))),
]

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

/** Насколько слово из названия подходит к основе из словаря; 0 — не подходит. */
function stemScore(word: string, stem: string): number {
  if (word.startsWith(stem)) {
    // Короткая основа («кол», «вин») не должна цеплять длинные чужие слова («колбаса», «виноград»).
    if (stem.length <= 3 && word.length > stem.length + 3) return 0
    return EXACT + stem.length
  }
  // Название ещё набирают: «мо» → молоко, морковь, мороженое.
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

export function suggestEmojis(name: string, limit = 11): EmojiSuggestion {
  const text = normalize(name)
  if (!text) return { options: DEFAULTS.slice(0, limit), best: null }

  // Числа и обозначения («2», «b12») словами не считаются: «2 молока» начинается с молока.
  const words = text.split(' ').filter((word) => /^[а-я]+$/.test(word))
  const scores = new Map<string, number>()
  const groupScores = new Map<Group, number>()
  const bump = <K>(map: Map<K, number>, key: K, score: number) => {
    if (score > (map.get(key) ?? 0)) map.set(key, score)
  }
  let confident = false

  words.forEach((word, index) => {
    const collect = (score: (word: string, stem: string) => number) => {
      let found = false
      for (const entry of ENTRIES) {
        const value = score(word, entry.word)
        if (value === 0) continue
        const total = value + (index === 0 ? FIRST_WORD_BONUS : 0)
        if (entry.emoji) {
          bump(scores, entry.emoji, total)
          bump(groupScores, entry.group, total)
          if (value >= EXACT && index === 0) confident = true
        } else {
          bump(groupScores, entry.group, total - 1)
        }
        found = true
      }
      return found
    }
    if (!collect(stemScore)) collect(typoScore)
  })

  const byScore = <K>(map: Map<K, number>) => [...map].sort((a, b) => b[1] - a[1])
  const direct = byScore(scores)
  const options = direct.map(([emoji]) => emoji)

  // Добираем соседями по группе, начиная с самой подходящей.
  for (const [group] of byScore(groupScores)) {
    for (const [emoji, itemGroup] of ITEMS) {
      if (itemGroup === group && !options.includes(emoji)) options.push(emoji)
    }
  }
  for (const emoji of DEFAULTS) {
    if (!options.includes(emoji)) options.push(emoji)
  }

  return {
    options: options.slice(0, limit),
    // Подставляем сами, только если первое слово названия нашлось в словаре целиком.
    best: confident && direct.length > 0 ? direct[0][0] : null,
  }
}
