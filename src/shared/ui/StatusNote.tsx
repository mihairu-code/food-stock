import type { ReactNode } from 'react'
import { useT } from '@/shared/i18n'
import { LoadingPicture, type LoadingKind } from './LoadingPicture'

interface StatusNoteProps {
  /** Без текста — «Загрузка…». */
  children?: ReactNode
  /** На весь экран, пока приложению показывать больше нечего (вход, выбор дома). */
  fullscreen?: boolean
  /**
   * Идёт загрузка: над текстом картинка. Вся строка появляется через 300 мс, чтобы
   * короткая загрузка не мелькала. У ошибок картинки нет.
   */
  loading?: LoadingKind
}

/** Строка состояния: «Загружаем…», «Не удалось загрузить». */
export function StatusNote({ children, fullscreen = false, loading }: StatusNoteProps) {
  const t = useT()
  return (
    <div className={fullscreen ? 'status-note splash' : 'status-note'} role="status" data-loading={loading !== undefined}>
      {loading && <LoadingPicture kind={loading} />}
      <p>{children ?? t('common.loading')}</p>
    </div>
  )
}
