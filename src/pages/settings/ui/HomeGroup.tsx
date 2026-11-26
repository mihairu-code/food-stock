import { backend, useHomeData } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session'
import { openSheet, SettingRow, SettingSelect, SettingsGroup } from '@/shared/ui'
import { LeaveHomeRow } from './LeaveHomeRow'

/**
 * Дом: название и аватарка (меняет владелец), разделы, переключатель, если домов несколько,
 * и выход из дома. В демо-режиме дом один и участник один — выходить некуда.
 */
export function HomeGroup() {
  const t = useT()
  const { household, role, memberships, selectHousehold } = useSession()
  const { sections } = useHomeData()

  return (
    <SettingsGroup label={t('settings.groupHome')}>
      <SettingRow
        leading={<span className="emoji" aria-hidden="true">{household.icon || '🏠'}</span>}
        title={household.name}
        meta={t(role === 'owner' ? 'settings.homeMeta' : 'settings.homeName')}
        onClick={role === 'owner' ? () => openSheet({ type: 'edit-home' }) : undefined}
      />
      <SettingRow
        to="/settings/sections"
        title={t('settings.sections')}
        meta={t('settings.sectionsMeta', { count: sections.length })}
      />
      {memberships.length > 1 && (
        <SettingSelect
          id="home-switch"
          title={t('settings.currentHome')}
          meta={t('settings.manyHomes')}
          value={household.id}
          onChange={selectHousehold}
        >
          {memberships.map(({ household: home }) => (
            <option key={home.id} value={home.id}>
              {home.icon ? `${home.icon} ${home.name}` : home.name}
            </option>
          ))}
        </SettingSelect>
      )}
      {backend.mode === 'supabase' && <LeaveHomeRow />}
    </SettingsGroup>
  )
}
