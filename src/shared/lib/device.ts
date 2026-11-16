import type { Translate } from '@/shared/i18n'

/**
 * Короткая подпись устройства — «Safari · iPhone», «App · iPhone».
 * Без аккаунта каждый браузер — отдельный участник дома; подпись помогает понять,
 * кто есть кто в списке участников. В базу она пишется без перевода, одинаково для
 * всех языков; на язык участника её переводит localizeDevice.
 */
export function describeDevice(userAgent: string, flags: { standalone: boolean; brave: boolean }): string {
  const os = /iPhone/.test(userAgent)
    ? 'iPhone'
    : /iPad/.test(userAgent)
      ? 'iPad'
      : /Android/.test(userAgent)
        ? 'Android'
        : /Macintosh/.test(userAgent)
          ? 'Mac'
          : /Windows/.test(userAgent)
            ? 'Windows'
            : /Linux/.test(userAgent)
              ? 'Linux'
              : 'device'

  // Порядок важен: почти каждый браузер называет себя и Chrome, и Safari.
  const browser = flags.standalone
    ? 'App'
    : flags.brave
      ? 'Brave'
      : /YaBrowser/.test(userAgent)
        ? 'Yandex'
        : /Edg(e|A|iOS)?\//.test(userAgent)
          ? 'Edge'
          : /Firefox|FxiOS/.test(userAgent)
            ? 'Firefox'
            : /OPR\/|OPT\//.test(userAgent)
              ? 'Opera'
              : /Chrome\/|CriOS/.test(userAgent)
                ? 'Chrome'
                : /Safari\//.test(userAgent)
                  ? 'Safari'
                  : 'Browser'

  return `${browser} · ${os}`
}

export function currentDevice(): string {
  const nav = navigator as Navigator & { standalone?: boolean; brave?: unknown }
  return describeDevice(nav.userAgent, {
    standalone: nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches,
    brave: nav.brave !== undefined,
  })
}

/** Подпись устройства на языке интерфейса. Понимает и подписи, записанные прежними версиями по-русски. */
export function localizeDevice(device: string, t: Translate): string {
  return device
    .split(' · ')
    .map((part) => {
      if (part === 'App' || part === 'Приложение') return t('device.app')
      if (part === 'Browser' || part === 'Браузер') return t('device.browser')
      if (part === 'device' || part === 'устройство') return t('device.unknown')
      return part
    })
    .join(' · ')
}
