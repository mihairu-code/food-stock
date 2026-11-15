import { useT } from '@/i18n'
import { Lines } from './Lines'
import { Mock } from './Mock'
import { Target } from './Target'

/** Строка меню Mac: «Файл» и пункт «Добавить в Dock» в нём. */
export function MacFileMenuPicture() {
  const t = useT()
  return (
    <Mock place="top">
      <span className="mock-menubar">
        <b>Safari</b>
        <Target>
          <span>{t('install.ui.file')}</span>
        </Target>
        <span>{t('install.ui.edit')}</span>
        <span>{t('install.ui.view')}</span>
      </span>
      <span className="mock-popover left">
        <Lines widths={[55, 70]} />
        <Target>
          <span className="mock-row strong">{t('install.ui.addDock')}</span>
        </Target>
        <Lines widths={[45]} />
      </span>
    </Mock>
  )
}
