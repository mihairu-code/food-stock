import { ChevronLeft, Ellipsis, Lock, Share } from 'lucide-react'
import { useT } from '@/i18n'
import { Lines } from './Lines'
import { Mock } from './Mock'
import { Target } from './Target'

/** Safari на iPhone: меню «⋯» у адресной строки внизу и пункт «Поделиться» в нём. */
export function SafariMenuPicture() {
  const t = useT()
  return (
    <Mock place="bottom">
      <span className="mock-popover right">
        <Target>
          <span className="mock-row strong">
            <Share size={14} /> {t('install.ui.share')}
          </span>
        </Target>
        <Lines widths={[60]} />
      </span>
      <span className="mock-bar">
        <span className="mock-icon">
          <ChevronLeft size={16} />
        </span>
        <span className="mock-address">
          <Lock size={10} /> {window.location.host}
        </span>
        <Target round>
          <span className="mock-icon">
            <Ellipsis size={16} />
          </span>
        </Target>
      </span>
    </Mock>
  )
}
