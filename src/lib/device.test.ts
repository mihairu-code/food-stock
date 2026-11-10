import { expect, it } from 'vitest'
import { describeDevice } from './device'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.0.0 Mobile/15E148 Safari/604.1'
const WINDOWS_EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'
const WINDOWS_YANDEX =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 YaBrowser/25.10.0 Safari/537.36'

const browser = { standalone: false, brave: false }

it('различает браузеры и системы', () => {
  expect(describeDevice(IPHONE_SAFARI, browser)).toBe('Safari · iPhone')
  expect(describeDevice(IPHONE_CHROME, browser)).toBe('Chrome · iPhone')
  expect(describeDevice(MAC_CHROME, browser)).toBe('Chrome · Mac')
  expect(describeDevice(ANDROID_CHROME, browser)).toBe('Chrome · Android')
  expect(describeDevice(WINDOWS_EDGE, browser)).toBe('Edge · Windows')
  expect(describeDevice(WINDOWS_YANDEX, browser)).toBe('Yandex · Windows')
})

it('приложение на экране «Домой» и Brave узнаются по признакам, а не по строке браузера', () => {
  expect(describeDevice(IPHONE_SAFARI, { standalone: true, brave: false })).toBe('Приложение · iPhone')
  expect(describeDevice(MAC_CHROME, { standalone: false, brave: true })).toBe('Brave · Mac')
  expect(describeDevice(IPHONE_SAFARI, { standalone: false, brave: true })).toBe('Brave · iPhone')
})

it('незнакомая строка не ломает подпись', () => {
  expect(describeDevice('', browser)).toBe('Браузер · устройство')
})
