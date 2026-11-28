/** Элемент под вырезом: первый видимый с этим data-coach (спрятанная вкладка не в счёт). */
export function findCoachTarget(name: string | undefined): HTMLElement | null {
  if (!name) return null
  for (const element of document.querySelectorAll<HTMLElement>(`[data-coach="${name}"]`)) {
    if (element.getClientRects().length > 0) return element
  }
  return null
}
