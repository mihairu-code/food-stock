import { createStore, useStore } from '../store'

/** Какие окна подсказок и советов уже показаны на этом устройстве. */
const SEEN_KEY = 'home-stock:coach-seen'
/** Повторяющиеся советы, отложенные до срока: id → время в мс. */
const SNOOZED_KEY = 'home-stock:coach-snoozed'
/** Когда показан последний совет. */
const LAST_TIP_KEY = 'home-stock:tip-last'
const DAY_MS = 24 * 60 * 60 * 1000
/**
 * Окно, повод для которого был ещё до закрытия прошлого (накопились, пока приложение было
 * закрыто, или человека позвали в заполненный дом), ждёт после прошлого окна столько.
 * Окно, вызванное свежим действием человека, ждать не должно.
 */
export const BACKLOG_GAP_MS = 60_000
/** Советы — не чаще раза в сутки: они про привычки, а не про кнопки, и не срочные. */
export const TIP_GAP_MS = DAY_MS

/**
 * Что делает касание в вырезе: нажимает сам элемент (и окно закрывается), листает шаги
 * или ничего. Закрыть окно касанием мимо или в вырез нельзя — только его кнопкой.
 */
export type CoachTap = 'press' | 'next' | 'none'

export interface CoachAction {
  label: string
  primary?: boolean
  run?: () => void
}

export interface CoachStep {
  /** Значение `data-coach` у элемента под вырезом. Без него окно стоит по центру. */
  target?: string
  title?: string
  text: string
  /** Движение элемента, пока окно открыто: ставится ему в `data-coach-motion`. */
  motion?: string
  /** Касание в вырезе на этом шаге, если не такое, как у всего окна. */
  tap?: CoachTap
}

export interface CoachRequest {
  id: string
  /** Если поводов несколько сразу, первым идёт меньший номер. */
  order: number
  steps: CoachStep[]
  tap: CoachTap
  /**
   * `tip` — совет по привычке: не чаще раза в сутки. `feature` — совет по функции
   * (перестановка, поиск): не раньше чем через минуту после прошлого окна, даже если повод
   * свежий, — после обучения они не должны сыпаться подряд. `tour` — шаг обучения: не
   * отмечается показанным навсегда (обучение можно пройти заново), а по закрытию зовёт `onDone`.
   */
  kind?: 'tip' | 'feature' | 'tour'
  /** Человек закрыл окно сам (кнопкой, Escape или нажав элемент в вырезе). */
  onDone?: () => void
  /** Закрытый совет вернётся через столько дней, а не исчезнет насовсем («Не напоминать» — насовсем). */
  repeatDays?: number
  /** Строка над текстом, например «Обучение · 2 из 5». */
  progress?: string
  /** Кнопки последнего шага; без них — «Понятно». */
  actions?: CoachAction[]
}

/** Повод показать окно и с какого момента он есть. */
export interface CoachCandidate {
  request: CoachRequest
  since: number
}

/** Что очередь помнит о прошлых окнах. */
export interface CoachMemory {
  seen: ReadonlySet<string>
  snoozed: Readonly<Record<string, number>>
  lastClosedAt: number
  lastTipAt: number
}

/** Разбор сохранённого списка: битая или чужая запись не должна ронять приложение. */
export function parseSeen(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Разбор отложенных советов: только записи «id → число». */
export function parseSnoozed(raw: string | null): Record<string, number> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, until]) => typeof until === 'number'))
  } catch {
    return {}
  }
}

function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // хранилище недоступно — окно или совет покажутся снова после перезагрузки, это не страшно
  }
}

export interface CoachPick {
  candidate: CoachCandidate | null
  /** Когда спросить снова, если сейчас показать нечего, но кто-то ждёт паузы. */
  retryAt: number | null
}

/**
 * Какое окно показать сейчас. Свежий повод (появился после закрытия прошлого окна) — сразу,
 * накопившийся — не раньше чем через BACKLOG_GAP_MS. Совет — не раньше чем через сутки после
 * прошлого совета. Отложенный совет ждёт своего срока. Из готовых — с меньшим номером.
 */
export function pickCoach(candidates: readonly CoachCandidate[], memory: CoachMemory, now: number): CoachPick {
  // Советов ещё не было — первому ждать нечего.
  const tipsFrom = memory.lastTipAt > 0 ? memory.lastTipAt + TIP_GAP_MS : 0
  const backlogFrom = memory.lastClosedAt + BACKLOG_GAP_MS
  let retryAt = Infinity
  const ready: CoachCandidate[] = []
  for (const candidate of candidates) {
    const { id, kind } = candidate.request
    if (memory.seen.has(id)) continue
    const from = Math.max(
      memory.snoozed[id] ?? 0,
      kind === 'tip' ? tipsFrom : 0,
      candidate.since > memory.lastClosedAt && kind !== 'feature' ? 0 : backlogFrom,
    )
    if (from <= now) ready.push(candidate)
    else retryAt = Math.min(retryAt, from)
  }
  ready.sort((a, b) => a.request.order - b.request.order)
  if (ready.length > 0) return { candidate: ready[0], retryAt: null }
  return { candidate: null, retryAt: Number.isFinite(retryAt) ? retryAt : null }
}

const candidates = createStore<readonly CoachCandidate[]>([])
const seen = createStore<ReadonlySet<string>>(new Set(parseSeen(readItem(SEEN_KEY))))
const active = createStore<CoachRequest | null>(null)
let snoozed = parseSnoozed(readItem(SNOOZED_KEY))
let lastTipAt = Number(readItem(LAST_TIP_KEY)) || 0
let lastClosedAt = 0

/** Экран говорит: повод для окна есть. Повторный вызов обновляет тексты, но не время повода. */
export function offerCoach(request: CoachRequest): void {
  const list = candidates.get()
  const existing = list.find((candidate) => candidate.request.id === request.id)
  if (existing?.request === request) return
  const since = existing?.since ?? Date.now()
  candidates.set([...list.filter((candidate) => candidate !== existing), { request, since }])
}

/** Повода больше нет (условие перестало выполняться или экран ушёл). Открытое окно закроется само. */
export function withdrawCoach(id: string): void {
  const list = candidates.get()
  if (list.some((candidate) => candidate.request.id === id)) {
    candidates.set(list.filter((candidate) => candidate.request.id !== id))
  }
}

/** Выбрать окно на показ: вызывает CoachHost, когда экран спокоен. */
export function nextCoach(now = Date.now()): CoachPick {
  return pickCoach(candidates.get(), { seen: seen.get(), snoozed, lastClosedAt, lastTipAt }, now)
}

export function startCoach(request: CoachRequest): void {
  active.set(request)
}

/**
 * Окно закрылось. `seen` — человек его видел: подсказка больше не покажется, повторяющийся
 * совет отложится на свой срок. false — окно пропало без участия человека (элемент исчез),
 * и при новом поводе оно покажется снова.
 */
export function finishCoach(id: string, { seen: wasSeen }: { seen: boolean }): void {
  const request = active.get()
  if (request?.id !== id) return
  const now = Date.now()
  // Шаг обучения не запоминается показанным: его ведёт своё состояние (tour.ts), и
  // обучение можно пройти заново целиком.
  if (wasSeen && request.kind !== 'tour') {
    if (request.repeatDays) {
      snoozed = { ...snoozed, [id]: now + request.repeatDays * DAY_MS }
      writeItem(SNOOZED_KEY, JSON.stringify(snoozed))
    } else {
      markCoachSeen(id)
    }
  }
  if (wasSeen && request.kind === 'tip') {
    lastTipAt = now
    writeItem(LAST_TIP_KEY, String(now))
  }
  lastClosedAt = now
  active.set(null)
  if (wasSeen) request.onDone?.()
}

/**
 * Отметить показанным насовсем: то, что показывается без окна (длинный текст тоста в первый
 * раз), или повторяющийся совет после «Не напоминать». «Показать заново» вернёт и его.
 */
export function markCoachSeen(id: string): void {
  if (seen.get().has(id)) return
  const next = new Set(seen.get()).add(id)
  seen.set(next)
  writeItem(SEEN_KEY, JSON.stringify([...next]))
}

export const isCoachSeen = (id: string): boolean => seen.get().has(id)

/** «Показать подсказки и советы заново». */
export function resetCoachSeen(): void {
  seen.set(new Set())
  writeItem(SEEN_KEY, '[]')
  snoozed = {}
  writeItem(SNOOZED_KEY, '{}')
  lastTipAt = 0
  writeItem(LAST_TIP_KEY, '0')
}

export const useCoachCandidates = () => useStore(candidates)
export const useCoachSeen = () => useStore(seen)
export const useActiveCoach = () => useStore(active)
