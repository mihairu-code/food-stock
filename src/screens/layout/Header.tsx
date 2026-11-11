import { useLocation } from 'react-router'
import { useSession } from '@/app/session'
import { useT, type MessageKey } from '@/i18n'

/** Заголовок экрана по адресу. */
function titleKey(pathname: string): MessageKey {
  if (pathname.startsWith('/shopping')) return 'nav.shopping'
  if (pathname.startsWith('/settings')) return 'nav.settings'
  return 'title.home'
}

export function Header() {
  const t = useT()
  const { household } = useSession()
  const { pathname } = useLocation()
  return (
    <header className="header">
      <div className="kicker">{household.name}</div>
      <h1>{t(titleKey(pathname))}</h1>
    </header>
  )
}
