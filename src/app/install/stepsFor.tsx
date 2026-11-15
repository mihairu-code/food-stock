import type { MessageKey } from '@/i18n'
import type { InstallTarget } from '@/lib/install'

/** Шаги установки под устройство и браузер: что нажать. */
export function stepsFor({ device, method }: InstallTarget): MessageKey[] {
  switch (method) {
    case 'ios':
    case 'ios-other':
      return [method === 'ios' ? 'install.ios1' : 'install.iosOther1', 'install.ios2', 'install.ios3']
    case 'android':
      return ['install.android1', 'install.android2', 'install.android3']
    case 'desktop':
      return ['install.desktop1', 'install.desktop2', device === 'mac' ? 'install.desktop3Mac' : 'install.desktop3Windows']
    case 'safari-mac':
      return ['install.safariMac1', 'install.safariMac2', 'install.safariMac3']
    case 'none':
      return []
  }
}
