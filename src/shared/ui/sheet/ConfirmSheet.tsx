import type { ReactNode } from 'react'
import { Sheet } from './Sheet'
import { SheetActions } from './SheetActions'
import { closeSheet } from './sheetStore'

export interface ConfirmSheetProps {
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
}

/** Подтверждение необратимого действия. После подтверждения шторка закрывается сама. */
export function ConfirmSheet({ title, description, confirmLabel, onConfirm }: ConfirmSheetProps) {
  return (
    <Sheet title={title} description={description}>
      <SheetActions focusClose>
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
      </SheetActions>
    </Sheet>
  )
}
