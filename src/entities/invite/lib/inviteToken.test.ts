import { expect, it } from 'vitest'
import { parseInviteToken } from './inviteToken'

const TOKEN = '0123456789abcdef0123456789abcdef'

it('достаёт токен из ссылки, якоря и из самого токена', () => {
  expect(parseInviteToken(`https://example.com/#join=${TOKEN}`)).toBe(TOKEN)
  expect(parseInviteToken(`#join=${TOKEN}`)).toBe(TOKEN)
  expect(parseInviteToken(`  ${TOKEN.toUpperCase()}\n`)).toBe(TOKEN)
  expect(parseInviteToken(`Заходи: https://example.com/#join=${TOKEN} — жду`)).toBe(TOKEN)
})

it('отклоняет всё, что не похоже на приглашение', () => {
  expect(parseInviteToken('')).toBeNull()
  expect(parseInviteToken('https://example.com/')).toBeNull()
  expect(parseInviteToken(`#join=${TOKEN.slice(1)}`)).toBeNull()
  expect(parseInviteToken(`#join=${TOKEN}0`)).toBeNull()
  expect(parseInviteToken('привет')).toBeNull()
})
