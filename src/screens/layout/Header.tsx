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
      {/* Аватарка дома; пока её не выбрали — инициалы участников. */}
      <Link className="avatar" to="/settings" data-icon={Boolean(household.icon)} aria-label={t('header.settingsLink')}>
        {household.icon || initials || <UserRound size={18} aria-hidden="true" />}
      </Link>
    </header>
  )
}
