import { useState, type ReactNode } from 'react'
import { useT } from '@/shared/i18n'
import { LoadingPicture, type LoadingKind } from './LoadingPicture'

/** Через сколько проявляется загрузка — как задержка в statusNote.css. */
const APPEAR_DELAY_MS = 300

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
  // Полноэкранная загрузка при запуске сменяет заставку из index.html или такую же
  // загрузку другого шага (вход → список домов). Если страница грузится дольше паузы,
  // холодильник уже на экране — новая пауза спрятала бы его на 300 мс.
  const [instant] = useState(() => fullscreen && performance.now() > APPEAR_DELAY_MS)
  return (
    <div
      className={fullscreen ? 'status-note splash' : 'status-note'}
      role="status"
      data-loading={loading !== undefined}
      data-instant={instant}
    >
      {loading && <LoadingPicture kind={loading} />}
      <p>{children ?? t('common.loading')}</p>
    </div>
  )
}
