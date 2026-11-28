import { describe, expect, it } from 'vitest'
import {
  BACKLOG_GAP_MS,
  parseSeen,
  parseSnoozed,
  pickCoach,
  TIP_GAP_MS,
  type CoachCandidate,
  type CoachMemory,
} from './coach'

const candidate = (id: string, order: number, since: number, kind?: 'tip'): CoachCandidate => ({
  request: { id, order, steps: [{ text: id }], tap: 'none', kind },
  since,
})

const memory = (patch: Partial<CoachMemory> = {}): CoachMemory => ({
  seen: new Set(),
  snoozed: {},
  lastClosedAt: 0,
  lastTipAt: 0,
  ...patch,
})

describe('очередь окон подсказок', () => {
  it('из готовых первым идёт меньший номер', () => {
    const pick = pickCoach([candidate('swipe', 5, 10), candidate('row', 3, 10)], memory(), 20)
    expect(pick.candidate?.request.id).toBe('row')
  })

  it('показанное окно второй раз не выбирается', () => {
    const pick = pickCoach([candidate('row', 3, 10)], memory({ seen: new Set(['row']) }), 20)
    expect(pick).toEqual({ candidate: null, retryAt: null })
  })

  it('свежий повод после закрытия прошлого окна — сразу, без паузы', () => {
    const closedAt = 1_000
    const pick = pickCoach([candidate('swipe', 5, closedAt + 5)], memory({ lastClosedAt: closedAt }), closedAt + 10)
    expect(pick.candidate?.request.id).toBe('swipe')
  })

  it('накопившийся повод ждёт минуту после прошлого окна', () => {
    const closedAt = 1_000
    const backlog = [candidate('drag', 6, 500)]
    expect(pickCoach(backlog, memory({ lastClosedAt: closedAt }), closedAt + 10)).toEqual({
      candidate: null,
      retryAt: closedAt + BACKLOG_GAP_MS,
    })
    expect(pickCoach(backlog, memory({ lastClosedAt: closedAt }), closedAt + BACKLOG_GAP_MS).candidate?.request.id).toBe(
      'drag',
    )
  })

  it('свежий повод не ждёт, даже если накопившийся с меньшим номером ещё ждёт', () => {
    const closedAt = 1_000
    const pick = pickCoach(
      [candidate('drag', 6, 500), candidate('buy', 7, closedAt + 1)],
      memory({ lastClosedAt: closedAt }),
      closedAt + 2,
    )
    expect(pick.candidate?.request.id).toBe('buy')
  })

  it('при первом запуске окна прошлого нет — показываем сразу', () => {
    expect(pickCoach([candidate('row', 3, 5)], memory(), 6).candidate?.request.id).toBe('row')
  })
})

describe('очередь советов', () => {
  it('совет — не раньше чем через сутки после прошлого совета, подсказка ждать не должна', () => {
    const tipAt = 10_000
    const list = [candidate('tip-minimal', 107, 1, 'tip'), candidate('search', 9, tipAt + 1)]
    const soon = pickCoach(list, memory({ lastTipAt: tipAt, lastClosedAt: tipAt }), tipAt + 5)
    expect(soon.candidate?.request.id).toBe('search')

    const onlyTip = pickCoach([list[0]], memory({ lastTipAt: tipAt, lastClosedAt: tipAt }), tipAt + 5)
    expect(onlyTip).toEqual({ candidate: null, retryAt: tipAt + TIP_GAP_MS })
    expect(pickCoach([list[0]], memory({ lastTipAt: tipAt }), tipAt + TIP_GAP_MS).candidate?.request.id).toBe(
      'tip-minimal',
    )
  })

  it('отложенный совет ждёт своего срока', () => {
    const until = 50_000
    const list = [candidate('tip-account', 103, 1, 'tip')]
    expect(pickCoach(list, memory({ snoozed: { 'tip-account': until } }), until - 1)).toEqual({
      candidate: null,
      retryAt: until,
    })
    expect(pickCoach(list, memory({ snoozed: { 'tip-account': until } }), until).candidate?.request.id).toBe(
      'tip-account',
    )
  })
})

describe('отметки о показанном', () => {
  it('читаются из списка строк', () => {
    expect(parseSeen('["row","swipe"]')).toEqual(['row', 'swipe'])
  })

  it('пустая, битая или чужая запись — пустой список', () => {
    expect(parseSeen(null)).toEqual([])
    expect(parseSeen('{')).toEqual([])
    expect(parseSeen('{"a":1}')).toEqual([])
    expect(parseSeen('["row",1,null]')).toEqual(['row'])
  })

  it('отложенные советы: только записи с числом', () => {
    expect(parseSnoozed('{"tip-account":123,"bad":"x"}')).toEqual({ 'tip-account': 123 })
    expect(parseSnoozed('[1,2]')).toEqual({})
    expect(parseSnoozed('oops')).toEqual({})
  })
})
