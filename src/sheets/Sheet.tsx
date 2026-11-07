import { useEffect, useId, useRef, type ReactNode } from 'react'

interface SheetProps {
  title: string
  description?: ReactNode
  onClose: () => void
  children: ReactNode
}

/**
 * Нижняя шторка на нативном <dialog>: фокус остаётся внутри, Esc закрывает.
 * Монтируется только пока открыта — так форма внутри каждый раз чистая.
 */
export function Sheet({ title, description, onClose, children }: SheetProps) {
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
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Нажатие на затемнение вокруг шторки.
        if (event.target === ref.current) onClose()
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
