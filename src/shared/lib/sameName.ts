/** Название для сравнения: без лишних пробелов и без разницы в регистре — «Молоко » и «молоко» одно и то же. */
export const normalizeName = (name: string): string => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()

export const sameName = (a: string, b: string): boolean => normalizeName(a) === normalizeName(b)

/** Запись с таким же названием — продукт или ручная позиция; сама редактируемая запись не в счёт. */
export function findNamed<T extends { id: string; name: string }>(
  records: readonly T[],
  name: string,
  exceptId?: string,
): T | undefined {
  const wanted = normalizeName(name)
  return records.find((record) => record.id !== exceptId && normalizeName(record.name) === wanted)
}
