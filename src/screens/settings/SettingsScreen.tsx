import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronRight, Link2, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/app/session'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import { queryClient } from '@/data/queryClient'
import type { Member } from '@/domain/types'
import { inviteLink, saveName } from '@/lib/invite'
import { readTheme, setTheme, type ThemeSetting } from '@/lib/theme'
import { ConfirmSheet } from '@/sheets/ConfirmSheet'
import { InviteLinkSheet } from '@/sheets/InviteLinkSheet'
import { JoinSheet } from '@/sheets/JoinSheet'
import { NameSheet } from '@/sheets/NameSheet'

const THEME_LABELS: Record<ThemeSetting, string> = {
  auto: 'Как на устройстве',
  light: 'Светлая',
  dark: 'Тёмная',
}

type SettingsSheet =
  | { type: 'reset' }
  | { type: 'remove-member'; member: Member }
  | { type: 'invite-link'; link: string }
  | { type: 'join' }
  | { type: 'name' }

const memberLabel = (member: Member) => member.display_name || (member.role === 'owner' ? 'Владелец' : 'Участник')

export function SettingsScreen() {
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
    onSettled: refreshHome,
  })
  const revokeInvite = useMutation({ mutationFn: (id: string) => backend.deleteInvite(id), onSettled: refreshHome })
  const setDisplayName = useMutation({
    mutationFn: (name: string) => backend.setDisplayName(hid, name),
    onSettled: refreshHome,
  })
  const removeMember = useMutation({
    mutationFn: (userId: string) => backend.removeMember(hid, userId),
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
  }

  async function resetDemo() {
    await backend.resetLocalData?.()
    await queryClient.invalidateQueries()
  }

  return (
    <>
      {shared && (
        <>
          <h2 className="group-label">Участники</h2>
          <div className="card">
            {members.data?.map((member) => (
              <div className="setting-row" key={member.user_id}>
                <span className="row-text">
                  <span className="row-name">
                    {memberLabel(member)}
                    {member.user_id === user.id && ' (вы)'}
                  </span>
                  {member.display_name && (
                    <span className="row-meta">{member.role === 'owner' ? 'Владелец' : 'Участник'}</span>
                  )}
                </span>
                {isOwner && member.role !== 'owner' && (
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label={`Удалить «${memberLabel(member)}» из дома`}
                    onClick={() => setSheet({ type: 'remove-member', member })}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            {invites.data?.map((invite) => {
              const until = new Date(invite.expires_at).toLocaleDateString('ru', { day: 'numeric', month: 'long' })
              return (
                <div className="setting-row" key={invite.id}>
                  <span className="row-text">
                    <span className="row-name">Ссылка-приглашение</span>
                    <span className="row-meta">Не использована · действует до {until}</span>
                  </span>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label={`Отозвать ссылку, действующую до ${until}`}
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
                  <span className="row-name accent">Пригласить по ссылке</span>
                  <span className="row-meta">Одноразовая, действует 7 дней</span>
                </span>
                <Link2 className="chevron" size={18} aria-hidden="true" />
              </button>
            )}
          </div>

          <h2 className="group-label">Вы</h2>
          <div className="card">
            <button className="setting-row" type="button" onClick={() => setSheet({ type: 'name' })}>
              <span className="row-text">
                <span className="row-name">Ваше имя</span>
                <span className="row-meta">{me?.display_name || 'Не указано'}</span>
              </span>
              <UserRound className="chevron" size={18} aria-hidden="true" />
            </button>
            <button className="setting-row" type="button" onClick={() => setSheet({ type: 'join' })}>
              <span className="row-text">
                <span className="row-name">Присоединиться по ссылке</span>
                <span className="row-meta">Если вас пригласили в другой дом</span>
              </span>
              <ChevronRight className="chevron" size={18} aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      <h2 className="group-label">Оформление</h2>
      <div className="card">
        <label className="setting-row">
          <span className="row-text">
            <span className="row-name">Тема</span>
          </span>
          <select
            className="inline-select"
            value={theme}
            onChange={(e) => changeTheme(e.target.value as ThemeSetting)}
          >
            {(Object.keys(THEME_LABELS) as ThemeSetting[]).map((value) => (
              <option key={value} value={value}>
                {THEME_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!shared && (
        <>
          <h2 className="group-label">Демо-режим</h2>
          <div className="card">
            <button className="setting-row" type="button" onClick={() => setSheet({ type: 'reset' })}>
              <span className="row-text">
                <span className="row-name">Сбросить данные</span>
                <span className="row-meta">Вернуть пример разделов и продуктов</span>
              </span>
              <ChevronRight className="chevron" size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="settings-note">Данные хранятся только в этом браузере.</p>
        </>
      )}

      {sheet?.type === 'reset' && (
        <ConfirmSheet
          title="Сбросить данные?"
          description="Всё, что вы добавили, пропадёт, а вместо этого появятся примеры."
          confirmLabel="Сбросить"
          onConfirm={() => void resetDemo()}
          onClose={close}
        />
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
      {sheet?.type === 'remove-member' && (
        <ConfirmSheet
          title="Удалить участника?"
          description={`«${memberLabel(sheet.member)}» больше не увидит этот дом.`}
          confirmLabel="Удалить"
          onConfirm={() => removeMember.mutate(sheet.member.user_id)}
          onClose={close}
        />
      )}
    </>
  )
}
