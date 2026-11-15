import type { MessageKey } from '@/i18n'
import { useT } from '@/i18n'
import { AppTile } from './AppTile'
import { Mock } from './Mock'
import { Target } from './Target'

interface DialogPictureProps {
  title: MessageKey
  confirm: MessageKey
}

/** Окно подтверждения браузера: значок, название, «Отмена» и кнопка, на которую нажать. */
export function DialogPicture({ title, confirm }: DialogPictureProps) {
  const t = useT()
  return (
    <Mock place="center">
      <span className="mock-dialog">
        <span className="mock-title">{t(title)}</span>
        <span className="mock-row">
          <AppTile />
          <span className="mock-stack">
            <span className="mock-name">{t('app.name')}</span>
            <span className="mock-muted">{window.location.host}</span>
          </span>
        </span>
        <span className="mock-buttons">
          <span className="mock-muted">{t('install.ui.cancel')}</span>
          <Target>
            <span className="mock-action filled">{t(confirm)}</span>
          </Target>
        </span>
      </span>
    </Mock>
  )
}
