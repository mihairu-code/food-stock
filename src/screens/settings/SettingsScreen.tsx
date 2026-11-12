import { ChevronRight, Link2, X } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/app/session'
import { backend } from '@/data'
import { useCreateInvite, useInvites, useMembers, useRevokeInvite } from '@/data/hooks'
import { LANG_NAMES, LANGS, setLangSetting, useLang, useT, type LangSetting } from '@/i18n'
import { inviteLink } from '@/lib/invite'
import { memberIdentity, memberLabel } from '@/lib/memberText'
import { readTheme, setTheme, type ThemeSetting } from '@/lib/theme'
import { openSheet } from '@/sheets'
import { AccountGroup } from './AccountGroup'

const THEME_KEYS = {
  auto: 'settings.themeAuto',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
} as const

export function SettingsScreen() {
  const t = useT()
  const { lang, setting: langSetting } = useLang()
  const { user, role } = useSession()
  const isOwner = role === 'owner'
  const shared = backend.mode === 'supabase'
  const [theme, setThemeState] = useState(readTheme)

  const members = useMembers().data
  const invites = useInvites().data
  const me = members?.find((member) => member.user_id === user.id)
  const createInvite = useCreateInvite()
  const revokeInvite = useRevokeInvite()

  function changeTheme(next: ThemeSetting) {
    setTheme(next)
    setThemeState(next)
  }

  return (
    <>
      {shared && (
        <>
          <h2 className="group-label">{t('settings.groupMembers')}</h2>
          <div className="card">
            {members?.map((member) => {
              const label = memberLabel(member, t)
              return (
                <div className="setting-row" key={member.user_id}>
                  <span className="row-text">
                    <span className="row-name">{member.user_id === user.id ? `${label} ${t('settings.you')}` : label}</span>
                    <span className="row-meta">{memberIdentity(member, t)}</span>
                  </span>
                  {isOwner && member.role !== 'owner' && (
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={t('settings.removeMemberAria', { name: label })}
                      onClick={() => openSheet({ type: 'remove-member', member })}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )
            })}
            {isOwner && invites?.map((invite) => {
              const date = new Date(invite.expires_at).toLocaleDateString(lang, { day: 'numeric', month: 'long' })
              return (
                <div className="setting-row" key={invite.id}>
                  <span className="row-text">
                    <span className="row-name">{t('invite.title')}</span>
                    <span className="row-meta">{t('invite.rowMeta', { date })}</span>
                  </span>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label={t('invite.revokeAria', { date })}
                    onClick={() => revokeInvite.mutate(invite.id)}
                  >
                    <X size={18} />
                  </button>
                </div>
              )
            })}
            {isOwner && (
              <button
                className="setting-row"
                type="button"
                disabled={createInvite.isPending}
                onClick={() =>
                  createInvite.mutate(undefined, {
                    onSuccess: (token) => openSheet({ type: 'invite-link', link: inviteLink(token) }),
                  })
                }
              >
                <span className="row-text">
                  <span className="row-name accent">{t('invite.create')}</span>
                  <span className="row-meta">{t('invite.createMeta')}</span>
                </span>
                <Link2 className="chevron" size={18} aria-hidden="true" />
              </button>
            )}
          </div>

          <AccountGroup name={me?.display_name ?? ''} />
        </>
      )}

      <h2 className="group-label">{t('settings.groupApp')}</h2>
      <div className="card">
        <label className="setting-row">
          <span className="row-text">
            <span className="row-name">{t('settings.language')}</span>
          </span>
          <select
            className="inline-select"
            value={langSetting}
            onChange={(e) => setLangSetting(e.target.value as LangSetting)}
          >
            <option value="auto">{t('settings.languageAuto')}</option>
            {LANGS.map((code) => (
              <option key={code} value={code}>
                {LANG_NAMES[code]}
              </option>
            ))}
          </select>
        </label>
        <label className="setting-row">
          <span className="row-text">
            <span className="row-name">{t('settings.theme')}</span>
          </span>
          <select
            className="inline-select"
            value={theme}
            onChange={(e) => changeTheme(e.target.value as ThemeSetting)}
          >
            {(Object.keys(THEME_KEYS) as ThemeSetting[]).map((value) => (
              <option key={value} value={value}>
                {t(THEME_KEYS[value])}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!shared && (
        <>
          <h2 className="group-label">{t('settings.groupData')}</h2>
          <div className="card">
            <button className="setting-row" type="button" onClick={() => openSheet({ type: 'reset' })}>
              <span className="row-text">
                <span className="row-name">{t('settings.reset')}</span>
                <span className="row-meta">{t('settings.resetMeta')}</span>
              </span>
              <ChevronRight className="chevron" size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="settings-note">{t('settings.demoText')}</p>
        </>
      )}

    </>
  )
}
