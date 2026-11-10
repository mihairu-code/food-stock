import type { MergeKeep, MergePreview } from '@/domain/types'
import { fateOf, homeNames, homeSummary } from './mergeText'

interface MergeChoiceProps {
  email: string
  preview: MergePreview
  onChoose: (keep: MergeKeep) => void
}

/** И на устройстве, и в аккаунте есть свои дома с данными — человек выбирает, какие оставить. */
export function MergeChoice({ email, preview, onChoose }: MergeChoiceProps) {
  const options = [
    { keep: 'device', label: 'С этого устройства', kept: preview.device, lost: preview.account },
    { keep: 'account', label: 'Из аккаунта', kept: preview.account, lost: preview.device },
  ] as const

  return (
    <main className="auth">
      <div className="auth-emoji" aria-hidden="true">
        🏠
      </div>
      <h1>Какой дом оставить?</h1>
      <p className="auth-lead">
        В аккаунте {email} уже есть свой дом с данными, и на этом устройстве тоже. Оставить можно только один.
      </p>
      {options.map(({ keep, label, kept, lost }) => (
        <div className="card welcome-card" key={keep}>
          <div className="hint-label">{label}</div>
          {kept.map((home) => (
            <div key={home.id}>
              <div className="row-name">{home.name}</div>
              <div className="row-meta">{homeSummary(home)}</div>
            </div>
          ))}
          <button
            className="btn"
            type="button"
            onClick={() => {
              if (window.confirm(`Оставить ${homeNames(kept)}? ${fateOf(lost)}`)) onChoose(keep)
            }}
          >
            Оставить этот
          </button>
          <p className="welcome-note">{fateOf(lost)}</p>
        </div>
      ))}
    </main>
  )
}
