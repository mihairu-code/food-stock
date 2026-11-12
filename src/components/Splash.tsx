import type { ReactNode } from 'react'
import { useT } from '@/i18n'

/** Экран ожидания на весь экран; без текста — «Загрузка…». */
export function Splash({ children }: { children?: ReactNode }) {
  const t = useT()
  return <p className="status-note splash">{children ?? t('common.loading')}</p>
}
