import { Plus } from 'lucide-react'

/** Строка-кнопка «＋ Добавить…» под списком. */
export function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="add-row" type="button" onClick={onClick}>
      <Plus size={16} /> {label}
    </button>
  )
}
