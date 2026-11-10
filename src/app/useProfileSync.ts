import { useEffect } from 'react'
import { backend } from '@/data'
import { queryClient } from '@/data/queryClient'
import type { Membership, User } from '@/domain/types'
import { currentDevice } from '@/lib/device'

/** Что уже записано на сервер с этого устройства: повторять тот же запрос при каждом запуске незачем. */
const SYNCED_KEY = 'home-stock:profile-synced'

/**
 * Подпись устройства и почта аккаунта — чтобы в списке участников было видно, кто есть
 * кто. Запрос уходит, только когда что-то изменилось: пользователь, устройство, имя или
 * состав его домов.
 */
export function useProfileSync(user: User, memberships: Membership[] | undefined, displayName: string): void {
  const homes = memberships?.map((membership) => membership.household.id).join(',') ?? ''

  useEffect(() => {
    if (!homes) return
    const device = currentDevice()
    const signature = [user.id, user.email ?? '', device, displayName, homes].join('|')
    if (localStorage.getItem(SYNCED_KEY) === signature) return
    // Отметка ставится сразу: повторный вызов эффекта не отправит второй запрос.
    localStorage.setItem(SYNCED_KEY, signature)
    backend
      .syncProfile(device, displayName)
      .then(() => queryClient.invalidateQueries({ predicate: ({ queryKey }) => queryKey[2] === 'members' }))
      .catch(() => {
        // Подпись — удобство, а не необходимость; попробуем при следующем запуске.
        localStorage.removeItem(SYNCED_KEY)
      })
  }, [user.id, user.email, displayName, homes])
}
