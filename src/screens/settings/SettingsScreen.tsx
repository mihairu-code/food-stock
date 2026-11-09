import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
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

type SettingsSheet = { type: 'reset' } | { type: 'remove-member'; member: Member }

const memberLabel = (member: Member) => member.display_name || (member.role === 'owner' ? 'Владелец' : 'Участник')

export function SettingsScreen() {
  const { user, household, role } = useSession()
  const hid = household.id
  const isOwner = role === 'owner'
  const shared = backend.mode === 'supabase'
  const [theme, setThemeState] = useState(readTheme)
  const [sheet, setSheet] = useState<SettingsSheet | null>(null)
  const close = () => setSheet(null)

  const members = useQuery({ queryKey: qk.members(hid), queryFn: () => backend.listMembers(hid) })

  const refreshHome = () => queryClient.invalidateQueries({ queryKey: qk.home(hid) })
  const removeMember = useMutation({
    mutationFn: (userId: string) => backend.removeMember(hid, userId),
    onSettled: refreshHome,
  })

  function changeTheme(next: ThemeSetting) {
    setTheme(next)
    setThemeState(next)
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
