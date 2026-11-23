import { isStandalone } from '../device'

/** Устройство, под которое показывается инструкция установки. */
export type InstallDevice = 'iphone' | 'ipad' | 'android' | 'windows' | 'mac' | 'computer'

/**
 * Как поставить приложение в этом браузере:
 * ios — Safari на iPhone и iPad, ios-other — другой браузер там же (Chrome, Firefox),
 * android — меню браузера на Android, desktop — значок установки в Chrome, Edge и
 * других браузерах на Chromium, safari-mac — «Добавить в Dock», none — браузер не умеет.
 */
export type InstallMethod = 'ios' | 'ios-other' | 'android' | 'desktop' | 'safari-mac' | 'none'

export interface InstallTarget {
  device: InstallDevice
  method: InstallMethod
}

/**
 * Что предложить человеку на экране входа. null — приложение уже открыто с экрана
 * «Домой» или в своём окне, предлагать нечего.
 */
export function installTarget(
  userAgent: string,
  flags: { standalone: boolean; touch: boolean },
): InstallTarget | null {
  if (flags.standalone) return null

  // Safari на iPad по умолчанию называет себя Mac — отличает его только сенсорный экран.
  const ipad = /iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && flags.touch)
  if (ipad || /iPhone|iPod/.test(userAgent)) {
    const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(userAgent)
    return { device: ipad ? 'ipad' : 'iphone', method: otherBrowser ? 'ios-other' : 'ios' }
  }
  if (/Android/.test(userAgent)) return { device: 'android', method: 'android' }

  const device: InstallDevice = /Windows/.test(userAgent) ? 'windows' : /Macintosh/.test(userAgent) ? 'mac' : 'computer'
  // Chrome, Edge, Яндекс, Opera и Brave — все на Chromium и называют себя Chrome.
  if (/Chrome\//.test(userAgent)) return { device, method: 'desktop' }
  if (device === 'mac' && /Safari\//.test(userAgent) && !/Firefox/.test(userAgent)) {
    return { device, method: 'safari-mac' }
  }
  return { device, method: 'none' }
}

export function currentInstallTarget(): InstallTarget | null {
  return installTarget(navigator.userAgent, { standalone: isStandalone(), touch: navigator.maxTouchPoints > 1 })
}
