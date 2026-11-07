import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { backend } from '@/data'
import { queryClient } from '@/data/queryClient'
import { readTheme, setTheme, type ThemeSetting } from '@/lib/theme'
import { ConfirmSheet } from '@/sheets/ConfirmSheet'

const THEME_LABELS: Record<ThemeSetting, string> = {
  auto: 'Как на устройстве',
  light: 'Светлая',
  dark: 'Тёмная',
}

export function SettingsScreen() {
  const [theme, setThemeState] = useState(readTheme)
  const [confirmReset, setConfirmReset] = useState(false)

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

      {backend.mode === 'local' && (
        <>
          <h2 className="group-label">Демо-режим</h2>
          <div className="card">
            <button className="setting-row" type="button" onClick={() => setConfirmReset(true)}>
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

      {confirmReset && (
        <ConfirmSheet
          title="Сбросить данные?"
          description="Всё, что вы добавили, пропадёт, а вместо этого появятся примеры."
          confirmLabel="Сбросить"
          onConfirm={() => void resetDemo()}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </>
  )
}
