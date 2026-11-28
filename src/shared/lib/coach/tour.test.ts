import { describe, expect, it } from 'vitest'
import { afterTourStep, parseTourStep, TOUR_DONE } from './tour'

describe('обучение', () => {
  it('закрытое окно своего шага двигает обучение дальше', () => {
    expect(afterTourStep(2, 2)).toBe(3)
  })

  it('окно чужого шага ничего не двигает', () => {
    expect(afterTourStep(3, 2)).toBe(3)
  })

  it('после последнего шага обучение пройдено и дальше не идёт', () => {
    expect(afterTourStep(TOUR_DONE - 1, TOUR_DONE - 1)).toBe(TOUR_DONE)
    expect(afterTourStep(TOUR_DONE, TOUR_DONE)).toBe(TOUR_DONE)
  })

  it('без записи или с мусором — с начала', () => {
    expect(parseTourStep(null)).toBe(1)
    expect(parseTourStep('abc')).toBe(1)
    expect(parseTourStep('0')).toBe(1)
    expect(parseTourStep('99')).toBe(1)
    expect(parseTourStep('4')).toBe(4)
  })
})
