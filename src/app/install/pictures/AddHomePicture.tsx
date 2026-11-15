import { useT } from '@/i18n'
import { AppTile } from './AppTile'
import { Mock } from './Mock'
import { Target } from './Target'

/** Последний шаг на iPhone: название, переключатель «веб-приложение» и кнопка «Добавить». */
export function AddHomePicture() {
  const t = useT()
  return (
    <Mock place="top">
      <span className="mock-sheet top">
        <span className="mock-header">
          <span className="mock-muted">{t('install.ui.cancel')}</span>
          <Target>
            <span className="mock-action">{t('install.ui.add')}</span>
          </Target>
        </span>
        <span className="mock-row">
          <AppTile />
          <span className="mock-name">{t('app.name')}</span>
        </span>
        <span className="mock-row spread">
          {t('install.ui.webApp')}
          <i className="mock-switch" />
        </span>
      </span>
    </Mock>
  )
}
