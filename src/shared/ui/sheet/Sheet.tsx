import { useEffect, useId, useRef, type ReactNode } from 'react'
import { closeSheet } from './sheetStore'
import { useSheetDismiss } from './useSheetDismiss'

interface SheetProps {
  title: string
  description?: ReactNode
  children: ReactNode
}

/**
 * Нижняя шторка на нативном <dialog>: фокус остаётся внутри, Esc закрывает, на телефоне
 * её можно стянуть вниз. Монтируется только пока открыта — так форма внутри каждый раз чистая.
 */
export function Sheet({ title, description, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  // Нажатие началось на затемнении, а не на самой шторке.
  const pressedBackdrop = useRef(false)
  useSheetDismiss(ref)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={closeSheet}
      onCancel={(event) => {
        event.preventDefault()
        closeSheet()
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === ref.current
      }}
      onClick={(event) => {
        // Закрывает только нажатие, которое и началось, и закончилось на затемнении. Шторка
        // под пальцем может сдвинуться (закрылась панель иконок, выехала клавиатура) — тогда
        // касание поля «заканчивается» на затемнении, и без этой проверки шторка закрывалась.
        if (event.target === ref.current && pressedBackdrop.current) closeSheet()
      }}
    >
      <div className="sheet-body">
        <div className="sheet-grip" aria-hidden="true" />
        <h2 id={titleId}>{title}</h2>
        {description && <p className="sheet-description">{description}</p>}
        {children}
      </div>
    </dialog>
  )
}
