/**
 * Строка с открытыми кнопками свайпа во всём приложении одна: открывая другую,
 * прежнюю закрываем. Строка узнаёт себя по постоянному маркеру `owner`.
 */
let openRow: { owner: object; close: () => void } | null = null

export const openSwipeRow = {
  /** Строка открылась: прежняя открытая закрывается. */
  claim(owner: object, close: () => void): void {
    if (openRow && openRow.owner !== owner) openRow.close()
    openRow = { owner, close }
  },
  /** Строка закрылась или исчезла. */
  release(owner: object): void {
    if (openRow?.owner === owner) openRow = null
  },
  /** Закрыть строку, если открыта именно она. */
  closeIfOpen(owner: object): void {
    if (openRow?.owner === owner) openRow.close()
  },
}
