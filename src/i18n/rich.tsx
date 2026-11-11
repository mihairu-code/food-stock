import type { ReactNode } from 'react'

/** Превращает `<b>…</b>` в переводе в выделение: порядок слов в каждом языке свой. */
export function rich(text: string): ReactNode {
  return text
    .split(/<b>(.*?)<\/b>/)
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part))
}
