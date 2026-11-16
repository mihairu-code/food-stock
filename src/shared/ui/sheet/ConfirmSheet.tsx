import type { ReactNode } from 'react'
import { useT } from '@/shared/i18n'
import { Sheet } from './Sheet'
import { closeSheet } from './sheetStore'

interface ConfirmSheetProps {
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
}

/** Подтверждение необратимого действия. После подтверждения шторка закрывается сама. */
export function ConfirmSheet({ title, description, confirmLabel, onConfirm }: ConfirmSheetProps) {
  const t = useT()
  return (
    <Sheet title={title} description={description}>
      <div className="sheet-actions">
        <button className="btn subtle" type="button" onClick={closeSheet} autoFocus>
          {t('common.cancel')}
        </button>
        <button
          className="btn danger"
          type="button"
          onClick={() => {
            onConfirm()
            closeSheet()
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}
