import type { ReactNode } from 'react'

/** Строка состояния внутри экрана: «Загружаем…», «Не удалось загрузить». */
export function StatusNote({ children }: { children: ReactNode }) {
  return <p className="status-note">{children}</p>
}
