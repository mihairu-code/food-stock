import { useResetLocalData } from '@/features/account/api/accountActions'
import { useT } from '@/shared/i18n'
import { ConfirmSheet } from '@/shared/ui/sheet/ConfirmSheet'

/** Только демо-режим: вернуть демо-данные к исходным. */
export function ResetDataSheet() {
  const t = useT()
  const reset = useResetLocalData()
  return (
    <ConfirmSheet
      title={t('confirm.resetTitle')}
      description={t('confirm.resetText')}
      confirmLabel={t('confirm.reset')}
      onConfirm={() => reset.mutate()}
    />
  )
}
