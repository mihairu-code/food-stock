import type { ReactNode } from 'react'
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
  return (
    <Sheet title={title} description={description} onClose={onClose}>
      <div className="sheet-actions">
        <button className="btn subtle" type="button" onClick={onClose} autoFocus>
          Отмена
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
