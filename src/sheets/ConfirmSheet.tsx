import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import { Sheet } from './Sheet'

interface ConfirmSheetProps {
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

/** Подтверждение необратимого действия. */
export function ConfirmSheet({ title, description, confirmLabel, onConfirm, onClose }: ConfirmSheetProps) {
  const t = useT()
  return (
    <Sheet title={title} description={description} onClose={onClose}>
      <div className="sheet-actions">
        <button className="btn subtle" type="button" onClick={onClose} autoFocus>
          {t('common.cancel')}
        </button>
        <button
          className="btn danger"
          type="button"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}
