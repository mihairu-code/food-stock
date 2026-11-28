import { useSession } from '@/shared/session'
import { daysSinceStart } from './daysSinceStart'

/** Сколько дней человек с приложением — советы по привычкам начинаются с третьего. */
export function useDaysSinceStart(): number {
  const { user } = useSession()
  return daysSinceStart(user.createdAt)
}
