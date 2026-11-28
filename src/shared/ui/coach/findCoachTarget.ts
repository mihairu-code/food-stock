/**
 * Элемент под вырезом: первый видимый с этим data-coach. Спрятанная вкладка не в счёт (у
 * неё нет размеров), строки свёрнутого раздела — тоже: размеры у них есть, но они в inert.
 */
export function findCoachTarget(name: string | undefined): HTMLElement | null {
  if (!name) return null
  for (const element of document.querySelectorAll<HTMLElement>(`[data-coach="${name}"]`)) {
    if (element.getClientRects().length > 0 && !element.closest('[inert]')) return element
  }
  return null
}
