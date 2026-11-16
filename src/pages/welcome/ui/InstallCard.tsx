import { ChevronDown, Download, Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { type MessageKey, useT } from '@/shared/i18n'
import type { InstallMethod, InstallTarget } from '@/shared/lib/install/install'
import { promptInstall, useCanPromptInstall } from '@/shared/lib/install/installPrompt'
import { InstallSteps } from './InstallSteps'

const LEAD: Record<InstallMethod, MessageKey> = {
  ios: 'install.leadIos',
  'ios-other': 'install.leadIos',
  android: 'install.leadAndroid',
  desktop: 'install.leadDesktop',
  'safari-mac': 'install.leadDesktop',
  none: 'install.leadNone',
}

/**
 * Под входом: можно остаться в браузере, а можно поставить приложение. Где браузер
 * умеет ставить сам (Chrome, Edge), — кнопка «Установить»; иначе и в запас — шаги.
 */
export function InstallCard({ target }: { target: InstallTarget }) {
  const t = useT()
  const canPrompt = useCanPromptInstall()
  const [open, setOpen] = useState(false)
  const phone = target.device === 'iphone' || target.device === 'ipad' || target.device === 'android'
  const Icon = phone ? Smartphone : Monitor

  return (
    <section className="card install-card" aria-labelledby="install-title">
      <h2 className="install-title" id="install-title">
        <Icon size={18} aria-hidden="true" /> {t('install.title')}
      </h2>
      <p className="install-lead">{t(LEAD[target.method])}</p>
      {canPrompt && (
        <button className="btn" type="button" onClick={promptInstall}>
          <Download size={16} aria-hidden="true" /> {t('install.button')}
        </button>
      )}
      {target.method !== 'none' && (
        <button
          className="btn subtle install-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="install-steps"
          onClick={() => setOpen(!open)}
        >
          {canPrompt ? t('install.manual') : t('install.howTo', { device: t(`install.device.${target.device}`) })}
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      )}
      {open && <InstallSteps id="install-steps" target={target} />}
    </section>
  )
}
