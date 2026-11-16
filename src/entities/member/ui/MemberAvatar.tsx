import { useState } from 'react'
import type { Member } from '@/shared/api'
import { memberInitial } from '../lib/memberText'

/**
 * Аватарка участника: фото из его аккаунта Google, если он вошёл через Google,
 * иначе первая буква имени. Если фото не загрузилось, тоже показывается буква.
 */
export function MemberAvatar({ member }: { member: Member }) {
  const [failed, setFailed] = useState(false)

  if (member.avatar_url && !failed) {
    return (
      <img
        className="avatar small"
        src={member.avatar_url}
        alt=""
        // Сервер с фотографиями отказывает запросам, которые раскрывают адрес приложения.
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span className="avatar small" aria-hidden="true">
      {memberInitial(member) || '•'}
    </span>
  )
}
