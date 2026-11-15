import { useT } from '@/i18n'
import { AppTile } from './AppTile'
import { Mock } from './Mock'
import { Target } from './Target'

/** Готово: приложение в своём окне, а его значок — в Dock на Mac или на панели задач Windows. */
export function DockPicture({ mac }: { mac: boolean }) {
  const t = useT()
  return (
    <Mock place="bottom">
      <span className="mock-app-window">
        <span className="mock-row">
          <AppTile size={16} />
          <span className="mock-name">{t('app.name')}</span>
        </span>
        <i className="mock-line" style={{ width: '70%' }} />
      </span>
      <span className={mac ? 'mock-dock' : 'mock-dock taskbar'}>
        {!mac && <i className="mock-start" />}
        <i />
        <i />
        <Target>
          <AppTile size={mac ? 30 : 24} />
        </Target>
        <i />
      </span>
    </Mock>
  )
}
