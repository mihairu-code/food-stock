/**
 * Идёт ли сейчас перетаскивание. Нужно жестам, которые делят палец с перетаскиванием
 * (свайп удаления): они сверяются с этим флагом в момент движения, поэтому строкам
 * не приходится перерисовываться только ради того, чтобы узнать о начале жеста.
 */
let active = false

export function setDragActive(next: boolean): void {
  active = next
}

export const isDragActive = (): boolean => active
