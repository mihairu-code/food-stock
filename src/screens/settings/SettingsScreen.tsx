import { ChevronRight, Link2, X } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/app/session'
import { backend } from '@/data'
import {
  useCreateInvite,
  useInvites,
  useJoinHousehold,
  useMembers,
  useRemoveMember,
  useResetLocalData,
  useRevokeInvite,
  useSetDisplayName,
  useSignOut,
} from '@/data/hooks'
import type { Member } from '@/domain/types'
import { LANG_NAMES, LANGS, setLangSetting, useLang, useT, type LangSetting } from '@/i18n'
import { inviteLink, saveName } from '@/lib/invite'
import { memberIdentity, memberLabel } from '@/lib/memberText'
import { readTheme, setTheme, type ThemeSetting } from '@/lib/theme'
import { notify } from '@/lib/toast'
import { ConfirmSheet } from '@/sheets/ConfirmSheet'
import { InviteLinkSheet } from '@/sheets/InviteLinkSheet'
import { JoinSheet } from '@/sheets/JoinSheet'
import { NameSheet } from '@/sheets/NameSheet'
import { AccountGroup } from './AccountGroup'

const THEME_KEYS = {
  auto: 'settings.themeAuto',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
} as const

type SettingsSheet =
  | { type: 'reset' }
  | { type: 'remove-member'; member: Member }
  | { type: 'invite-link'; link: string }
  | { type: 'join' }
  | { type: 'name' }
  | { type: 'sign-out' }

export function SettingsScreen() {
  const t = useT()
  const { lang, setting: langSetting } = useLang()
  const { user, household, role, selectHousehold } = useSession()
  const isOwner = role === 'owner'
  const shared = backend.mode === 'supabase'
  const [theme, setThemeState] = useState(readTheme)
  const [sheet, setSheet] = useState<SettingsSheet | null>(null)
  const close = () => setSheet(null)

  const members = useMembers().data
  const invites = useInvites().data
  const me = members?.find((member) => member.user_id === user.id)
  const createInvite = useCreateInvite()
  const revokeInvite = useRevokeInvite()
  const setDisplayName = useSetDisplayName()
  const removeMember = useRemoveMember()
  const joinHousehold = useJoinHousehold()
  const resetLocalData = useResetLocalData()
  const signOut = useSignOut()

  function changeTheme(next: ThemeSetting) {
    setTheme(next)
    setThemeState(next)
  }

  async function join(token: string) {
    selectHousehold(await joinHousehold.mutateAsync(token))
    notify('toast.joined')
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
                      onClick={() => setSheet({ type: 'remove-member', member })}
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
                    onSuccess: (token) => setSheet({ type: 'invite-link', link: inviteLink(token) }),
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

          <AccountGroup
            name={me?.display_name ?? ''}
            onEditName={() => setSheet({ type: 'name' })}
            onJoin={() => setSheet({ type: 'join' })}
            onSignOut={() => setSheet({ type: 'sign-out' })}
          />
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
            <button className="setting-row" type="button" onClick={() => setSheet({ type: 'reset' })}>
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

      {sheet?.type === 'invite-link' && <InviteLinkSheet link={sheet.link} onClose={close} />}
      {sheet?.type === 'join' && <JoinSheet onJoin={join} onClose={close} />}
      {sheet?.type === 'name' && (
        <NameSheet
          current={me?.display_name ?? ''}
          onSave={(name) => {
            saveName(name)
            setDisplayName.mutate(name)
          }}
          onClose={close}
        />
      )}
      {sheet?.type === 'reset' && (
        <ConfirmSheet
          title={t('confirm.resetTitle')}
          description={t('confirm.resetText')}
          confirmLabel={t('confirm.reset')}
          onConfirm={() => resetLocalData.mutate()}
          onClose={close}
        />
      )}
      {sheet?.type === 'sign-out' && (
        <ConfirmSheet
          title={t('confirm.signOutTitle')}
          description={t('confirm.signOutText')}
          confirmLabel={t('confirm.signOut')}
          onConfirm={() => signOut.mutate()}
          onClose={close}
        />
      )}
      {sheet?.type === 'remove-member' && (
        <ConfirmSheet
          title={t('confirm.removeMemberTitle')}
          description={t('confirm.removeMemberText', { name: memberLabel(sheet.member, t), home: household.name })}
          confirmLabel={t('common.delete')}
          onConfirm={() => removeMember.mutate(sheet.member.user_id)}
          onClose={close}
        />
      )}
    </>
  )
}
