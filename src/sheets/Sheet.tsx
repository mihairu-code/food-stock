import { useEffect, useId, useRef, type ReactNode } from 'react'
import { closeSheet } from './sheetStore'

interface SheetProps {
  title: string
  description?: ReactNode
  children: ReactNode
}

/**
 * Нижняя шторка на нативном <dialog>: фокус остаётся внутри, Esc закрывает.
 * Монтируется только пока открыта — так форма внутри каждый раз чистая.
 */
export function Sheet({ title, description, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

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
      onClick={(event) => {
        // Нажатие на затемнение вокруг шторки.
        if (event.target === ref.current) closeSheet()
      }}
    >
      <div className="sheet-body">
        <h2 id={titleId}>{title}</h2>
        {description && <p className="sheet-description">{description}</p>}
        {children}
      </div>
    </dialog>
  )
}
