import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronRight, LogOut, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSession } from '@/app/session'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import { queryClient } from '@/data/queryClient'
import type { Member } from '@/domain/types'
import { readTheme, setTheme, type ThemeSetting } from '@/lib/theme'
import { ConfirmSheet } from '@/sheets/ConfirmSheet'

const THEME_LABELS: Record<ThemeSetting, string> = {
  auto: 'Как на устройстве',
  light: 'Светлая',
  dark: 'Тёмная',
}

type SettingsSheet = { type: 'reset' } | { type: 'remove-member'; member: Member } | { type: 'sign-out' }

export function SettingsScreen() {
  const { user, household, role } = useSession()
  const hid = household.id
  const isOwner = role === 'owner'
  const shared = backend.mode === 'supabase'
  const [theme, setThemeState] = useState(readTheme)
  const [sheet, setSheet] = useState<SettingsSheet | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const close = () => setSheet(null)

  const members = useQuery({ queryKey: qk.members(hid), queryFn: () => backend.listMembers(hid) })
  const invites = useQuery({
    queryKey: qk.invites(hid),
    queryFn: () => backend.listInvites(hid),
    enabled: shared && isOwner,
  })

  const refreshHome = () => queryClient.invalidateQueries({ queryKey: qk.home(hid) })
  const invite = useMutation({
    mutationFn: (email: string) => backend.createInvite(hid, email),
    onSuccess: () => setInviteEmail(''),
    onSettled: refreshHome,
  })
  const revokeInvite = useMutation({ mutationFn: (id: string) => backend.deleteInvite(id), onSettled: refreshHome })
  const removeMember = useMutation({
    mutationFn: (userId: string) => backend.removeMember(hid, userId),
    onSettled: refreshHome,
  })

  function changeTheme(next: ThemeSetting) {
    setTheme(next)
    setThemeState(next)
  }

  function sendInvite(event: FormEvent) {
    event.preventDefault()
    if (inviteEmail.trim()) invite.mutate(inviteEmail.trim())
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
                    {member.email}
                    {member.user_id === user.id && ' (вы)'}
                  </span>
                  <span className="row-meta">{member.role === 'owner' ? 'Владелец' : 'Участник'}</span>
                </span>
                {isOwner && member.role !== 'owner' && (
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label={`Удалить ${member.email} из дома`}
                    onClick={() => setSheet({ type: 'remove-member', member })}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isOwner && (
            <>
              <h2 className="group-label">Пригласить</h2>
              <div className="card">
                <form className="invite-form" onSubmit={sendInvite}>
                  <input
                    type="email"
                    placeholder="Почта участника"
                    aria-label="Почта участника"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <button className="btn small" type="submit" disabled={!inviteEmail.trim() || invite.isPending}>
                    Пригласить
                  </button>
                </form>
                {invites.data?.map((pending) => (
                  <div className="setting-row" key={pending.id}>
                    <span className="row-text">
                      <span className="row-name">{pending.email}</span>
                      <span className="row-meta">Ждёт входа</span>
                    </span>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={`Отозвать приглашение для ${pending.email}`}
                      onClick={() => revokeInvite.mutate(pending.id)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
              {invite.isError && <p className="field-error">{invite.error.message}</p>}
              <p className="settings-note">
                Письмо не отправляется: человек увидит приглашение, когда войдёт с этой почтой.
              </p>
            </>
          )}
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

      {shared ? (
        <>
          <h2 className="group-label">Аккаунт</h2>
          <div className="card">
            <button className="setting-row" type="button" onClick={() => setSheet({ type: 'sign-out' })}>
              <span className="row-text">
                <span className="row-name">Выйти</span>
                <span className="row-meta">{user.email}</span>
              </span>
              <LogOut className="chevron" size={18} aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
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
      {sheet?.type === 'remove-member' && (
        <ConfirmSheet
          title="Удалить участника?"
          description={`${sheet.member.email} больше не увидит этот дом.`}
          confirmLabel="Удалить"
          onConfirm={() => removeMember.mutate(sheet.member.user_id)}
          onClose={close}
        />
      )}
      {sheet?.type === 'sign-out' && (
        <ConfirmSheet
          title="Выйти?"
          description="Чтобы вернуться, понадобится код из письма."
          confirmLabel="Выйти"
          onConfirm={() => void backend.signOut()}
          onClose={close}
        />
      )}
    </>
  )
}
