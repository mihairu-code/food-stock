import type { MergeKeep, MergePreview } from '@/shared/api/types'
import { useT } from '@/shared/i18n'
import { fateOf, homeNames, homeSummary } from './mergeText'

interface MergeChoiceProps {
  email: string
  preview: MergePreview
  onChoose: (keep: MergeKeep) => void
}

/** И на устройстве, и в аккаунте есть свои дома с данными — человек выбирает, какие оставить. */
export function MergeChoice({ email, preview, onChoose }: MergeChoiceProps) {
  const t = useT()
  const options = [
    { keep: 'device', label: t('merge.fromDevice'), kept: preview.device, lost: preview.account },
    { keep: 'account', label: t('merge.fromAccount'), kept: preview.account, lost: preview.device },
  ] as const

  return (
    <main className="auth">
      <div className="auth-emoji" aria-hidden="true">🏠</div>
      <h1>{t('merge.choiceTitle')}</h1>
      <p className="auth-lead">{t('merge.choiceLead', { email })}</p>
      {options.map(({ keep, label, kept, lost }) => (
        <div className="card welcome-card" key={keep}>
          <div className="hint-label">{label}</div>
          {kept.map((home) => (
            <div key={home.id}>
              <div className="row-name">{home.name}</div>
              <div className="row-meta">{homeSummary(home, t)}</div>
            </div>
          ))}
          <button
            className="btn"
            type="button"
            onClick={() => {
              const question = `${t('merge.confirm', { homes: homeNames(kept, t) })} ${fateOf(lost, t)}`
              if (window.confirm(question)) onChoose(keep)
            }}
          >
            {t('merge.keep')}
          </button>
          <p className="welcome-note">{fateOf(lost, t)}</p>
        </div>
      ))}
    </main>
  )
}
