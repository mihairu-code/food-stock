import type { ReactNode } from 'react'
import { useT } from '@/shared/i18n'

interface StatusNoteProps {
  /** Без текста — «Загрузка…». */
  children?: ReactNode
  /** На весь экран, пока приложению показывать больше нечего (вход, выбор дома). */
  fullscreen?: boolean
}

/** Строка состояния: «Загружаем…», «Не удалось загрузить». */
export function StatusNote({ children, fullscreen = false }: StatusNoteProps) {
  const t = useT()
  return <p className={fullscreen ? 'status-note splash' : 'status-note'}>{children ?? t('common.loading')}</p>
}
