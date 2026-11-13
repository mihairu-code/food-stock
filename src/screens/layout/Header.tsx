import { UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useSession } from '@/app/session'
import { useMembers } from '@/data/hooks'
import { useT } from '@/i18n'
import { memberInitials, titleKey } from './headerText'

export function Header() {
  const t = useT()
  const { household } = useSession()
  const { pathname } = useLocation()
  const members = useMembers().data
  const initials = memberInitials(members ?? [])

  return (
    <header className="header">
      <div>
        <div className="kicker">
          {household.name} · {t('n.members', { count: members?.length ?? 1 })}
        </div>
        <h1>{t(titleKey(pathname))}</h1>
      </div>
      {/* Инициалы участников — ссылка на настройки. */}
      <Link className="avatar" to="/settings" aria-label={t('header.settingsLink')}>
        {initials || <UserRound size={18} aria-hidden="true" />}
      </Link>
    </header>
  )
}
