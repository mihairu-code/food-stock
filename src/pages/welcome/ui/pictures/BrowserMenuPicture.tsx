import { MonitorDown } from 'lucide-react'
import { useT } from '@/shared/i18n'
import { Lines } from './Lines'
import { Mock } from './Mock'
import { Target } from './Target'

/** Открытое меню браузера на Android с пунктом «Установить приложение». */
export function BrowserMenuPicture() {
  const t = useT()
  return (
    <Mock place="top">
      <span className="mock-popover right top">
        <Lines widths={[60, 45]} />
        <Target>
          <span className="mock-row strong">
            <MonitorDown size={14} /> {t('install.ui.installApp')}
          </span>
        </Target>
        <Lines widths={[50]} />
      </span>
    </Mock>
  )
}
