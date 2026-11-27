import { describe, expect, it } from 'vitest'
import { BACKLOG_GAP_MS, parseSeen, pickCoach, type CoachCandidate } from './coach'

const candidate = (id: string, order: number, since: number): CoachCandidate => ({
  request: { id, order, steps: [{ text: id }], tap: 'close' },
  since,
})

describe('очередь окон подсказок', () => {
  it('из готовых первым идёт меньший номер', () => {
    const pick = pickCoach([candidate('swipe', 5, 10), candidate('row', 3, 10)], new Set(), 0, 20)
    expect(pick.candidate?.request.id).toBe('row')
  })

  it('показанное окно второй раз не выбирается', () => {
    const pick = pickCoach([candidate('row', 3, 10)], new Set(['row']), 0, 20)
    expect(pick).toEqual({ candidate: null, retryAt: null })
  })

  it('свежий повод после закрытия прошлого окна — сразу, без паузы', () => {
    const closedAt = 1_000
    const pick = pickCoach([candidate('swipe', 5, closedAt + 5)], new Set(), closedAt, closedAt + 10)
    expect(pick.candidate?.request.id).toBe('swipe')
  })

  it('накопившийся повод ждёт минуту после прошлого окна', () => {
    const closedAt = 1_000
    const backlog = [candidate('drag', 6, 500)]
    expect(pickCoach(backlog, new Set(), closedAt, closedAt + 10)).toEqual({
      candidate: null,
      retryAt: closedAt + BACKLOG_GAP_MS,
    })
    expect(pickCoach(backlog, new Set(), closedAt, closedAt + BACKLOG_GAP_MS).candidate?.request.id).toBe('drag')
  })

  it('свежий повод не ждёт, даже если накопившийся с меньшим номером ещё ждёт', () => {
    const closedAt = 1_000
    const pick = pickCoach([candidate('drag', 6, 500), candidate('buy', 7, closedAt + 1)], new Set(), closedAt, closedAt + 2)
    expect(pick.candidate?.request.id).toBe('buy')
  })

  it('при первом запуске окна прошлого нет — показываем сразу', () => {
    expect(pickCoach([candidate('row', 3, 5)], new Set(), 0, 6).candidate?.request.id).toBe('row')
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
})
