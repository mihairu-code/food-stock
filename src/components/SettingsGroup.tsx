import type { ReactNode } from 'react'

/** Группа настроек: заголовок и карточка со строками. */
export function SettingsGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <h2 className="group-label">{label}</h2>
      <div className="card list">{children}</div>
    </>
  )
}
