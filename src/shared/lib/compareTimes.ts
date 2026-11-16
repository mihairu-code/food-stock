/** Сравнение двух меток времени ISO для сортировки: раньше — выше. */
export const compareTimes = (a: string, b: string): number => Date.parse(a) - Date.parse(b)
