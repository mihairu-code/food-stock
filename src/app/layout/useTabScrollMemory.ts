import { useLayoutEffect, useState } from 'react'

/**
 * Своя прокрутка у каждой вкладки, которая остаётся в памяти: вернулся на «Дом» — он
 * там, где его оставили, даже если «Покупки» короче и браузер прижал бы прокрутку.
 * Остальные экраны открываются сверху.
 *
 * Положение старого экрана запоминается при первом рендере после перехода: страница
 * в этот момент ещё прежняя, и её прокрутка не тронута. Событие scroll для этого не
 * годится — к нему старый экран уже спрятан и прокрутка подрезана под новую высоту.
 */
export function useTabScrollMemory(pathname: string, keptPaths: readonly string[]): void {
  const [positions] = useState(() => new Map<string, number>())
  const [shownPath, setShownPath] = useState(pathname)

  if (shownPath !== pathname) {
    positions.set(shownPath, window.scrollY)
    setShownPath(pathname)
  }

  // До отрисовки: экран сразу появляется на своём месте, без кадра в чужой прокрутке.
  useLayoutEffect(() => {
    window.scrollTo(0, keptPaths.includes(pathname) ? (positions.get(pathname) ?? 0) : 0)
  }, [pathname, keptPaths, positions])
}
