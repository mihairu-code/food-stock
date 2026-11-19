import type { MergeKeep, MergePreview } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { AuthScreen, RowText } from '@/shared/ui'
import { fateOf, homeNames, homeSummary } from '../lib/mergeText'

interface MergeChoicePageProps {
  email: string
  preview: MergePreview
  onChoose: (keep: MergeKeep) => void
}

/** И на устройстве, и в аккаунте есть свои дома с данными — человек выбирает, какие оставить. */
export function MergeChoicePage({ email, preview, onChoose }: MergeChoicePageProps) {
  const t = useT()
  const options = [
    { keep: 'device', label: t('merge.fromDevice'), kept: preview.device, lost: preview.account },
    { keep: 'account', label: t('merge.fromAccount'), kept: preview.account, lost: preview.device },
  ] as const

  return (
    <AuthScreen title={t('merge.choiceTitle')} lead={t('merge.choiceLead', { email })}>
      {options.map(({ keep, label, kept, lost }) => (
        <section className="card welcome-card" key={keep}>
          <h2 className="hint-label">{label}</h2>
          {kept.map((home) => (
            <p key={home.id}>
              <RowText title={home.name} meta={homeSummary(home, t)} />
            </p>
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
        </section>
      ))}
    </AuthScreen>
  )
}
