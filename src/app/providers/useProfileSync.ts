import { useEffect } from 'react'
import { backend, queryClient, type Membership, type User } from '@/shared/api'
import { currentDevice } from '@/shared/lib/device'

/** Что уже записано на сервер с этого устройства: повторять тот же запрос при каждом запуске незачем. */
const SYNCED_KEY = 'home-stock:profile-synced'

/**
 * Подпись устройства, почта и фото аккаунта — чтобы в списке участников было видно,
 * кто есть кто. Запрос уходит, только когда что-то изменилось: пользователь, его фото,
 * устройство, имя или состав его домов.
 */
export function useProfileSync(user: User, memberships: Membership[] | undefined, displayName: string): void {
  const homes = memberships?.map((membership) => membership.household.id).join(',') ?? ''

  useEffect(() => {
    if (!homes) return
    const device = currentDevice()
    const signature = [user.id, user.email ?? '', user.avatarUrl ?? '', device, displayName, homes].join('|')
    if (localStorage.getItem(SYNCED_KEY) === signature) return
    // Отметка ставится сразу: повторный вызов эффекта не отправит второй запрос.
    localStorage.setItem(SYNCED_KEY, signature)
    backend
      .syncProfile(device, displayName)
      .then(() =>
        // Запрос меняет только строки участников — остальные данные дома перечитывать незачем.
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => queryKey[0] === 'hh' && queryKey[2] === 'members',
        }),
      )
      .catch(() => {
        // Подпись — удобство, а не необходимость; попробуем при следующем запуске.
        localStorage.removeItem(SYNCED_KEY)
      })
  }, [user.id, user.email, user.avatarUrl, displayName, homes])
}
