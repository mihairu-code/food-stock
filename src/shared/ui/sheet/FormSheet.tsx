import type { ReactNode } from 'react'
import { Sheet } from './Sheet'
import { SheetActions } from './SheetActions'

interface FormSheetProps {
  title: string
  description?: ReactNode
  submitLabel: string
  /** Отправить пока нельзя: не хватает данных. */
  disabled?: boolean
  onSubmit: () => void
  /** Поля формы. */
  children: ReactNode
  /** Второстепенное действие под основными кнопками. */
  footer?: ReactNode
}

/**
 * Шторка с формой: заголовок, поля, «Отмена» и основная кнопка. Каркас один на все
 * формы приложения, поэтому они устроены и выглядят одинаково.
 */
export function FormSheet({ title, description, submitLabel, disabled, onSubmit, children, footer }: FormSheetProps) {
  return (
    <Sheet title={title} description={description}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        {children}
        <SheetActions submitLabel={submitLabel} disabled={disabled} />
        {footer}
      </form>
    </Sheet>
  )
}
