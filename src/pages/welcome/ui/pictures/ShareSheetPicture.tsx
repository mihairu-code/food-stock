import { SquarePlus } from 'lucide-react'
import { useT } from '@/shared/i18n'
import { Lines } from './Lines'
import { Mock } from './Mock'
import { Target } from './Target'

/** Окно «Поделиться» на iPhone: ряд контактов, список действий и нужный пункт внизу. */
export function ShareSheetPicture() {
  const t = useT()
  return (
    <Mock place="bottom">
      <span className="mock-sheet">
        <span className="mock-circles">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="mock-list">
          <Lines widths={[55, 40]} />
          <Target>
            <span className="mock-row strong spread">
              {t('install.ui.addHome')} <SquarePlus size={14} />
            </span>
          </Target>
        </span>
      </span>
    </Mock>
  )
}
