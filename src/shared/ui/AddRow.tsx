import { Plus } from 'lucide-react'

interface AddRowProps {
  label: string
  onClick: () => void
  /** Метка для окна подсказки: по ней окно находит эту строку (data-coach). */
  coach?: string
}

/** Строка-кнопка «＋ Добавить…» под списком. */
export function AddRow({ label, onClick, coach }: AddRowProps) {
  return (
    <button className="add-row" type="button" data-coach={coach} onClick={onClick}>
      <Plus size={16} /> {label}
    </button>
  )
}
