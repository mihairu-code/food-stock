import { Children, type ReactNode } from 'react'

/** Группа настроек: заголовок и карточка со строками. Без строк пустая карточка не рисуется. */
export function SettingsGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="settings-group">
      <h2 className="group-label">{label}</h2>
      {Children.toArray(children).length > 0 && <div className="card list">{children}</div>}
    </section>
  )
}
