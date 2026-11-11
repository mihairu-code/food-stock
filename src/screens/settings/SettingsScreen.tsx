import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronRight, Link2, X } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/app/session'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import { queryClient } from '@/data/queryClient'
import type { Member } from '@/domain/types'
import { useLang, useT } from '@/i18n'
import { inviteLink, saveName } from '@/lib/invite'
import { memberIdentity, memberLabel } from '@/lib/memberText'
import { readTheme, setTheme, type ThemeSetting } from '@/lib/theme'
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

export function SettingsScreen() {
  const t = useT()
  const { lang } = useLang()
  const toast = useToast()
  const { user, household, role, selectHousehold } = useSession()
  const hid = household.id
  const isOwner = role === 'owner'
  const shared = backend.mode === 'supabase'
  const [theme, setThemeState] = useState(readTheme)
  const [sheet, setSheet] = useState<SettingsSheet | null>(null)
  const close = () => setSheet(null)

  const members = useQuery({ queryKey: qk.members(hid), queryFn: () => backend.listMembers(hid) })
  const invites = useQuery({
    queryKey: qk.invites(hid),
    queryFn: () => backend.listInvites(hid),
    enabled: shared && isOwner,
  })
  const me = members.data?.find((member) => member.user_id === user.id)

  const refreshHome = () => queryClient.invalidateQueries({ queryKey: qk.home(hid) })
  const createInvite = useMutation({
    mutationFn: () => backend.createInvite(hid),
    onSuccess: (token) => setSheet({ type: 'invite-link', link: inviteLink(token) }),
    onError: () => toast(t('toast.linkError')),
    onSettled: refreshHome,
  })
  const revokeInvite = useMutation({
    mutationFn: (id: string) => backend.deleteInvite(id),
    onSuccess: () => toast(t('toast.linkRevoked')),
    onSettled: refreshHome,
  })
  const setDisplayName = useMutation({
    mutationFn: (name: string) => backend.setDisplayName(hid, name),
    onError: () => toast(t('toast.nameError')),
    onSettled: refreshHome,
  })
  const removeMember = useMutation({
    mutationFn: (userId: string) => backend.removeMember(hid, userId),
    onSuccess: () => toast(t('toast.memberRemoved')),
    onSettled: refreshHome,
  })

  function changeTheme(next: ThemeSetting) {
    setTheme(next)
    setThemeState(next)
  }

  async function join(token: string) {
    const householdId = await backend.joinHousehold(token, me?.display_name ?? '')
    await queryClient.invalidateQueries()
    selectHousehold(householdId)
    toast(t('toast.joined'))
  }

  async function resetDemo() {
    await backend.resetLocalData?.()
    await queryClient.invalidateQueries()
    toast(t('toast.demoRestored'))
  }

  return (
    <>
      {shared && (
        <>
          <h2 className="group-label">{t('settings.groupMembers')}</h2>
          <div className="card">
            {members.data?.map((member) => {
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
            {invites.data?.map((invite) => {
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
                onClick={() => createInvite.mutate()}
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
          />
        </>
      )}

      <h2 className="group-label">{t('settings.groupApp')}</h2>
      <div className="card">
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
          onConfirm={() => void resetDemo()}
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
