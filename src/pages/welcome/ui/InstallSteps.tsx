import { useT } from '@/shared/i18n'
import { rich } from '@/shared/i18n/rich'
import type { InstallTarget } from '@/shared/lib/install/install'
import { stepsFor } from './installStepsFor'

/** Пронумерованные шаги: текст и под ним схема экрана с выделенной кнопкой. */
export function InstallSteps({ id, target }: { id: string; target: InstallTarget }) {
  const t = useT()
  const apple = target.method === 'ios' || target.method === 'ios-other' || target.method === 'safari-mac'

  return (
    <div className="install-steps" id={id}>
      <ol>
        {stepsFor(target).map((step, index) => (
          <li key={step.text} className="install-step">
            <span className="install-number" aria-hidden="true">
              {index + 1}
            </span>
            <div className="install-step-body">
              <p>{rich(t(step.text))}</p>
              {step.picture}
            </div>
          </li>
        ))}
      </ol>
      {/* У приложения на экране «Домой» на iPhone своё хранилище, отдельное от Safari. */}
      {apple && <p className="install-note">{t('install.appleNote')}</p>}
    </div>
  )
}
