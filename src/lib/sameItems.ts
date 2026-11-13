/** Те же элементы в том же порядке — для сравнения списков, которые собираются заново при каждом рендере. */
export function sameItems<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index])
}
