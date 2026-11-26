/**
 * Название для сравнения: без лишних пробелов, без разницы в регистре и между «ё» и «е» —
 * «Мёд » и «мед» одно и то же (как в поиске по дому).
 */
export const normalizeName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ').toLocaleLowerCase().replace(/ё/g, 'е')

export const sameName = (a: string, b: string): boolean => normalizeName(a) === normalizeName(b)

/** Запись с таким же названием — продукт, ручная позиция или раздел; сама редактируемая запись не в счёт. */
export function findNamed<T extends { id: string; name: string }>(
  records: readonly T[],
  name: string,
  exceptId?: string,
): T | undefined {
  const wanted = normalizeName(name)
  return records.find((record) => record.id !== exceptId && normalizeName(record.name) === wanted)
}
