import { queryClient } from './queryClient'

/**
 * Снимок последних загруженных данных дома. При запуске приложение сразу показывает
 * его и в фоне перечитывает данные с сервера — человек не смотрит на «Загрузка…»,
 * пока идут запросы. Снимок принадлежит одному пользователю: при выходе и смене
 * пользователя он стирается, поэтому чужие данные на устройстве не остаются.
 */
const KEY = 'home-stock:snapshot'
/** Меняется, когда меняется форма сохранённых данных: старый снимок тогда не читается. */
const VERSION = 1
const SAVE_DELAY_MS = 1000
const HOME_PARTS = new Set(['sections', 'products', 'shopping-items', 'members'])

type QueryKey = readonly unknown[]

interface Snapshot {
  version: number
  userId: string
  queries: [key: QueryKey, data: unknown][]
}

let owner: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined

function isSaved(key: QueryKey, data: unknown): boolean {
  // Пустой список домов не сохраняется: по нему приложение решило бы, что дома нет.
  if (key[0] === 'memberships') return Array.isArray(data) && data.length > 0
  return key[0] === 'hh' && HOME_PARTS.has(key[2] as string) && data !== undefined
}

function read(): Snapshot | null {
  try {
    const snapshot = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Snapshot | null
    return snapshot?.version === VERSION && Array.isArray(snapshot.queries) ? snapshot : null
  } catch {
    return null
  }
}

function remove(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // хранилище недоступно — стирать нечего
  }
}

function save(): void {
  // Пока свои правки летят на сервер, в кэше лежит оптимистичное состояние;
  // после ответа данные перечитаются, и снимок сохранится уже с настоящими.
  if (!owner || queryClient.isMutating() > 0) return
  const queries = queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => isSaved(query.queryKey, query.state.data))
    .map((query): Snapshot['queries'][number] => [query.queryKey, query.state.data])
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, userId: owner, queries } satisfies Snapshot))
  } catch {
    // хранилище переполнено или недоступно — следующий запуск просто начнётся с загрузки
  }
}

/**
 * Кладёт в кэш данные прошлого запуска этого пользователя и дальше сохраняет свежие.
 * Восстановленные данные помечены временем 0, то есть сразу считаются устаревшими
 * и перечитываются с сервера.
 */
export function openSnapshot(userId: string): void {
  owner = userId
  const snapshot = read()
  if (snapshot?.userId !== userId) {
    remove()
    return
  }
  for (const [key, data] of snapshot.queries) {
    if (isSaved(key, data) && queryClient.getQueryData(key) === undefined) {
      queryClient.setQueryData(key, data, { updatedAt: 0 })
    }
  }
}

/** Пользователя больше нет (выход) — его данные с устройства стираются. */
export function dropSnapshot(): void {
  owner = null
  clearTimeout(timer)
  remove()
}

queryClient.getQueryCache().subscribe(() => {
  if (!owner) return
  clearTimeout(timer)
  timer = setTimeout(save, SAVE_DELAY_MS)
})
