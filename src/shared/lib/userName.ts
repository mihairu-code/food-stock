/** Имя без фамилии: «Анна Петрова» → «Анна». */
export function firstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] ?? ''
}
