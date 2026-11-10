/**
 * Короткая подпись устройства — «Safari · iPhone», «Приложение · iPhone».
 * Без аккаунта каждый браузер — отдельный участник дома; подпись помогает понять,
 * кто есть кто в списке участников.
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
              : 'устройство'

  // Порядок важен: почти каждый браузер называет себя и Chrome, и Safari.
  const browser = flags.standalone
    ? 'Приложение'
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
                  : 'Браузер'

  return `${browser} · ${os}`
}

export function currentDevice(): string {
  const nav = navigator as Navigator & { standalone?: boolean; brave?: unknown }
  return describeDevice(nav.userAgent, {
    standalone: nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches,
    brave: nav.brave !== undefined,
  })
}
