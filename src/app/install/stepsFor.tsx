import { EllipsisVertical, Share } from 'lucide-react'
import type { ReactNode } from 'react'
import type { MessageKey } from '@/i18n'
import type { InstallTarget } from '@/lib/install'
import { AddHomePicture } from './pictures/AddHomePicture'
import { AddressBarPicture } from './pictures/AddressBarPicture'
import { BrowserMenuPicture } from './pictures/BrowserMenuPicture'
import { DesktopBarPicture } from './pictures/DesktopBarPicture'
import { DialogPicture } from './pictures/DialogPicture'
import { DockPicture } from './pictures/DockPicture'
import { MacFileMenuPicture } from './pictures/MacFileMenuPicture'
import { SafariMenuPicture } from './pictures/SafariMenuPicture'
import { ShareSheetPicture } from './pictures/ShareSheetPicture'

export interface InstallStep {
  text: MessageKey
  picture: ReactNode
}

/** Шаги установки под устройство и браузер: что нажать и как это выглядит. */
export function stepsFor({ device, method }: InstallTarget): InstallStep[] {
  switch (method) {
    case 'ios':
    case 'ios-other':
      return [
        method === 'ios'
          ? { text: 'install.ios1', picture: <SafariMenuPicture /> }
          : { text: 'install.iosOther1', picture: <AddressBarPicture icon={Share} /> },
        { text: 'install.ios2', picture: <ShareSheetPicture /> },
        { text: 'install.ios3', picture: <AddHomePicture /> },
      ]
    case 'android':
      return [
        { text: 'install.android1', picture: <AddressBarPicture icon={EllipsisVertical} /> },
        { text: 'install.android2', picture: <BrowserMenuPicture /> },
        {
          text: 'install.android3',
          picture: <DialogPicture title="install.ui.installQuestion" confirm="install.ui.install" />,
        },
      ]
    case 'desktop':
      return [
        { text: 'install.desktop1', picture: <DesktopBarPicture /> },
        {
          text: 'install.desktop2',
          picture: <DialogPicture title="install.ui.installQuestion" confirm="install.ui.install" />,
        },
        {
          text: device === 'mac' ? 'install.desktop3Mac' : 'install.desktop3Windows',
          picture: <DockPicture mac={device === 'mac'} />,
        },
      ]
    case 'safari-mac':
      return [
        { text: 'install.safariMac1', picture: <MacFileMenuPicture /> },
        {
          text: 'install.safariMac2',
          picture: <DialogPicture title="install.ui.addDockTitle" confirm="install.ui.add" />,
        },
        { text: 'install.safariMac3', picture: <DockPicture mac /> },
      ]
    case 'none':
      return []
  }
}
