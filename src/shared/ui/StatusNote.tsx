import { useState, type ReactNode } from 'react'
import { useT } from '@/shared/i18n'
import { bootLoadingKind, nextLoadingKind } from '@/shared/lib/loadingKind'
import { LoadingPicture } from './LoadingPicture'

/** Через сколько проявляется загрузка — как задержка в statusNote.css. */
const APPEAR_DELAY_MS = 300

interface StatusNoteProps {
  /** Без текста — «Загрузка…». */
  children?: ReactNode
  /** На весь экран, пока приложению показывать больше нечего (вход, выбор дома). */
  fullscreen?: boolean
  /**
   * Идёт загрузка: над текстом случайная картинка. Вся строка появляется через 300 мс,
   * чтобы короткая загрузка не мелькала. У ошибок картинки нет.
   */
  loading?: boolean
}

/** Строка состояния: «Загружаем…», «Не удалось загрузить». */
export function StatusNote({ children, fullscreen = false, loading = false }: StatusNoteProps) {
  const t = useT()
  // Полноэкранная загрузка — это запуск (вход → список домов) или слияние: она продолжает
  // заставку из index.html той же картинкой, иначе холодильник вдруг сменился бы полками.
  // Остальные загрузки берут новую случайную.
  const [kind] = useState(() => (!loading ? null : fullscreen ? bootLoadingKind() : nextLoadingKind()))
  // Если страница грузится дольше паузы, картинка уже на экране — новая пауза спрятала бы её.
  const [instant] = useState(() => fullscreen && performance.now() > APPEAR_DELAY_MS)
  return (
    <div
      className={fullscreen ? 'status-note splash' : 'status-note'}
      role="status"
      data-loading={loading}
      data-instant={instant}
    >
      {kind && <LoadingPicture kind={kind} />}
      <p>{children ?? t('common.loading')}</p>
    </div>
  )
}
