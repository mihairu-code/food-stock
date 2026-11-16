import { expect, it } from 'vitest'
import { installTarget } from './install'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.0.0 Mobile/15E148 Safari/604.1'
const IPAD_DESKTOP_MODE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15'
const MAC_SAFARI = IPAD_DESKTOP_MODE
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
const MAC_FIREFOX = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
const WINDOWS_EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'
const WINDOWS_FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0'
const LINUX_CHROME =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'

const browser = { standalone: false, touch: false }
const touch = { standalone: false, touch: true }

it('телефоны и планшеты получают свою инструкцию', () => {
  expect(installTarget(IPHONE_SAFARI, touch)).toEqual({ device: 'iphone', method: 'ios' })
  expect(installTarget(IPHONE_CHROME, touch)).toEqual({ device: 'iphone', method: 'ios-other' })
  expect(installTarget(ANDROID_CHROME, touch)).toEqual({ device: 'android', method: 'android' })
})

it('iPad, который называет себя Mac, узнаётся по сенсорному экрану', () => {
  expect(installTarget(IPAD_DESKTOP_MODE, touch)).toEqual({ device: 'ipad', method: 'ios' })
  expect(installTarget(MAC_SAFARI, browser)).toEqual({ device: 'mac', method: 'safari-mac' })
})

it('компьютеры: Chromium ставит из адресной строки, Firefox не умеет', () => {
  expect(installTarget(MAC_CHROME, browser)).toEqual({ device: 'mac', method: 'desktop' })
  expect(installTarget(WINDOWS_EDGE, browser)).toEqual({ device: 'windows', method: 'desktop' })
  expect(installTarget(LINUX_CHROME, browser)).toEqual({ device: 'computer', method: 'desktop' })
  expect(installTarget(WINDOWS_FIREFOX, browser)).toEqual({ device: 'windows', method: 'none' })
  expect(installTarget(MAC_FIREFOX, browser)).toEqual({ device: 'mac', method: 'none' })
})

it('уже установленному приложению ничего не предлагается', () => {
  expect(installTarget(IPHONE_SAFARI, { standalone: true, touch: true })).toBeNull()
  expect(installTarget(WINDOWS_EDGE, { standalone: true, touch: false })).toBeNull()
})
