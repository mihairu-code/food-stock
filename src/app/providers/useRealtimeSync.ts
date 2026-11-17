import { useEffect } from 'react'
import { backend, queryClient, qk, type DataChange, type HomeTable } from '@/shared/api'

/** Несколько событий подряд (перестановка, каскадное удаление) обрабатываются одним пакетом. */
const BATCH_MS = 150
/**
 * Сколько после своей правки события могут оказаться её эхом. Эхо, пришедшее после
 * следующей правки, вернуло бы на экран старое состояние, поэтому такие события
 * не накладываются на кэш, а перечитывают затронутую таблицу.
 */
const ECHO_WINDOW_MS = 2000

/** Третья часть ключа кэша: ['hh', дом, часть]. */
const CACHE_PART: Record<HomeTable, string> = {
  sections: 'sections',
  products: 'products',
  shopping_items: 'shopping-items',
}

interface Received {
  change: DataChange
  /** Пришло, пока свои правки летели на сервер или только что вернулись. */
  maybeEcho: boolean
}

type Row = { id: string }

const isPart = (part: string) => ({ queryKey }: { queryKey: readonly unknown[] }) =>
  queryKey[0] === 'hh' && queryKey[2] === part

/** Строка другого участника — в кэш его дома: новая встаёт в конец, изменённая заменяет прежнюю. */
function putRow(table: HomeTable, row: Row & { household_id: string }): void {
  queryClient.setQueryData<Row[]>(['hh', row.household_id, CACHE_PART[table]], (list) => {
    if (!list) return list
    const index = list.findIndex((existing) => existing.id === row.id)
    if (index < 0) return [...list, row]
    const next = [...list]
    next[index] = row
    return next
  })
}

/** Удалённая строка: событие знает только её идентификатор, поэтому ищем её во всех загруженных домах. */
function dropRow(table: HomeTable, id: string): void {
  for (const query of queryClient.getQueryCache().findAll({ predicate: isPart(CACHE_PART[table]) })) {
    queryClient.setQueryData<Row[]>(query.queryKey, (list) => list?.filter((row) => row.id !== id))
  }
}

/** Что перечитать с сервера, когда строку на месте поправить нельзя: ровно ту часть данных, что изменилась. */
function refetchTable(table: HomeTable | 'households' | 'household_members' | 'household_invites'): void {
  switch (table) {
    case 'households':
      void queryClient.invalidateQueries({ queryKey: qk.memberships })
      return
    case 'household_members':
      // Состав участников меняет и список домов: меня самого могли удалить из дома.
      void queryClient.invalidateQueries({ queryKey: qk.memberships })
      void queryClient.invalidateQueries({ predicate: isPart('members') })
      return
    case 'household_invites':
      void queryClient.invalidateQueries({ predicate: isPart('invites') })
      return
    default:
      void queryClient.invalidateQueries({ predicate: isPart(CACHE_PART[table]) })
  }
}

function applyBatch(batch: Received[]): void {
  if (batch.some(({ change }) => change.kind === 'everything')) {
    void queryClient.invalidateQueries({ queryKey: ['hh'] })
    void queryClient.invalidateQueries({ queryKey: qk.memberships })
    return
  }
  const toRefetch = new Set<Parameters<typeof refetchTable>[0]>()
  for (const { change, maybeEcho } of batch) {
    if (change.kind === 'everything') continue
    if (change.kind === 'table' || maybeEcho) toRefetch.add(change.table)
    else if (change.kind === 'upsert') putRow(change.table, change.row)
    else dropRow(change.table, change.id)
  }
  toRefetch.forEach(refetchTable)
}

/**
 * Держит данные свежими, когда их меняет другой участник или другое устройство.
 * Сервер присылает изменённую строку целиком — она ложится прямо в кэш, без запроса
 * за всем домом. Пока свои правки летят на сервер, события копятся: иначе они легли бы
 * поверх оптимистичного состояния.
 */
export function useRealtimeSync(): void {
  useEffect(() => {
    let timer: number | undefined
    let pending: Received[] = []
    let echoUntil = 0

    const stopWatchingMutations = queryClient.getMutationCache().subscribe(() => {
      echoUntil = Date.now() + ECHO_WINDOW_MS
    })

    const flushWhenIdle = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (queryClient.isMutating() > 0) return flushWhenIdle()
        const batch = pending
        pending = []
        applyBatch(batch)
      }, BATCH_MS)
    }

    const unsubscribe = backend.subscribe((change) => {
      pending.push({ change, maybeEcho: queryClient.isMutating() > 0 || Date.now() < echoUntil })
      flushWhenIdle()
    })
    return () => {
      window.clearTimeout(timer)
      stopWatchingMutations()
      unsubscribe()
    }
  }, [])
}
