import { createStore, useStore } from '../store'

/** Какие окна подсказок и советов уже показаны на этом устройстве. */
const SEEN_KEY = 'home-stock:coach-seen'
/**
 * Окно, повод для которого был ещё до закрытия прошлого (накопились, пока приложение было
 * закрыто, или человека позвали в заполненный дом), ждёт после прошлого окна столько.
 * Окно, вызванное свежим действием человека, ждать не должно.
 */
export const BACKLOG_GAP_MS = 60_000

/** Что делает касание в вырезе: нажимает сам элемент, листает шаги или просто закрывает окно. */
export type CoachTap = 'press' | 'next' | 'close'

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
}

export interface CoachRequest {
  id: string
  /** Если поводов несколько сразу, первым идёт меньший номер. */
  order: number
  steps: CoachStep[]
  tap: CoachTap
  /** Строка над текстом, например «Первые шаги · 2 из 5». */
  progress?: string
  /** Кнопки последнего шага; без них — «Понятно». */
  actions?: CoachAction[]
}

/** Повод показать окно и с какого момента он есть. */
export interface CoachCandidate {
  request: CoachRequest
  since: number
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

function readSeen(): ReadonlySet<string> {
  try {
    return new Set(parseSeen(localStorage.getItem(SEEN_KEY)))
  } catch {
    return new Set()
  }
}

function writeSeen(seen: ReadonlySet<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
  } catch {
    // хранилище недоступно — окно покажется снова после перезагрузки, это не страшно
  }
}

export interface CoachPick {
  candidate: CoachCandidate | null
  /** Когда спросить снова, если сейчас показать нечего, но кто-то ждёт паузы. */
  retryAt: number | null
}

/**
 * Какое окно показать сейчас. Свежий повод (появился после закрытия прошлого окна) — сразу,
 * накопившийся — не раньше чем через BACKLOG_GAP_MS. Из готовых — с меньшим номером.
 */
export function pickCoach(
  candidates: readonly CoachCandidate[],
  seen: ReadonlySet<string>,
  lastClosedAt: number,
  now: number,
): CoachPick {
  const waiting = candidates.filter(({ request }) => !seen.has(request.id))
  const ready = waiting
    .filter(({ since }) => since > lastClosedAt || now - lastClosedAt >= BACKLOG_GAP_MS)
    .sort((a, b) => a.request.order - b.request.order)
  if (ready.length > 0) return { candidate: ready[0], retryAt: null }
  return { candidate: null, retryAt: waiting.length > 0 ? lastClosedAt + BACKLOG_GAP_MS : null }
}

const candidates = createStore<readonly CoachCandidate[]>([])
const seen = createStore<ReadonlySet<string>>(readSeen())
const active = createStore<CoachRequest | null>(null)
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
  return pickCoach(candidates.get(), seen.get(), lastClosedAt, now)
}

export function startCoach(request: CoachRequest): void {
  active.set(request)
}

/**
 * Окно закрылось. `seen` — человек его видел и больше показывать не надо; false — окно
 * пропало без участия человека (элемент исчез), и при новом поводе оно покажется снова.
 */
export function finishCoach(id: string, { seen: wasSeen }: { seen: boolean }): void {
  if (active.get()?.id !== id) return
  if (wasSeen) markCoachSeen(id)
  lastClosedAt = Date.now()
  active.set(null)
}

/**
 * Отметить показанным то, что показывается без окна, — например, длинный текст тоста
 * в первый раз. «Показать заново» вернёт и его.
 */
export function markCoachSeen(id: string): void {
  if (seen.get().has(id)) return
  const next = new Set(seen.get()).add(id)
  seen.set(next)
  writeSeen(next)
}

export const isCoachSeen = (id: string): boolean => seen.get().has(id)

/** «Показать подсказки и советы заново». */
export function resetCoachSeen(): void {
  seen.set(new Set())
  writeSeen(new Set())
}

export const useCoachCandidates = () => useStore(candidates)
export const useCoachSeen = () => useStore(seen)
export const useActiveCoach = () => useStore(active)
