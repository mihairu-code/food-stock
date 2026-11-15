import type { ReactNode } from 'react'

/** То, куда нужно нажать: обведено акцентным цветом и мягко пульсирует. */
export function Target({ children, round }: { children: ReactNode; round?: boolean }) {
  return <span className={round ? 'mock-target round' : 'mock-target'}>{children}</span>
}
