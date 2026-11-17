import { Pencil, Trash2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/shared/i18n'
import { SortableRow } from './SortableRow'
import { SwipeRow } from './SwipeRow'

interface ListRowProps {
  id: string
  /** Что это за строка для перетаскивания (см. SortableRow). */
  kind: string
  /** Пояснение роли для скринридера: «продукт, можно переставить». */
  dragDescription: string
  icon: ReactNode
  name: string
  meta: string
  /** Продукта дома нет: строка приглушена. */
  missing?: boolean
  /** Строка ещё сохраняется: кнопки и перетаскивание недоступны. */
  disabled?: boolean
  /** На строку можно бросить другую; false — когда она не видна. */
  droppable?: boolean
  /**
   * Копия строки под пальцем во время перетаскивания: только сама строка, без
   * перетаскивания и свайпа. Обёртку-«призрак» рисует список.
   */
  ghost?: boolean
  /** Нажатие на иконку с названием. Без него иконка и название — просто текст. */
  main?: { label: string; onClick: () => void }
  /** Кнопка справа: плюс/минус на «Доме», галочка в покупках. */
  toggle: { label: string; icon: ReactNode; on?: boolean; onClick: () => void }
  /** Подпись карандаша для скринридера: «Изменить „Молоко“». */
  editLabel: string
  onEdit: () => void
  /** Подпись крестика для скринридера и кнопки удаления в свайпе. */
  removeLabel: string
  removeSwipeLabel: string
  onRemove: () => void
}

/**
 * Строка списка продуктов — одна и на «Доме», и в покупках: иконка, название с подписью
 * и кнопка справа. Свайп влево открывает «Изменить» и удаление; мышью и с клавиатуры
 * те же действия — карандаш и крестик слева от кнопки, чтобы она не уезжала из-под
 * курсора. Строку можно перетащить на другое место.
 */
export function ListRow({
  id,
  kind,
  dragDescription,
  icon,
  name,
  meta,
  missing,
  disabled = false,
  droppable = true,
  ghost = false,
  main,
  toggle,
  editLabel,
  onEdit,
  removeLabel,
  removeSwipeLabel,
  onRemove,
}: ListRowProps) {
  const t = useT()
  const text = (
    <span className="row-text">
      <span className="row-name">{name}</span>
      <span className="row-meta">{meta}</span>
    </span>
  )

  const row = (
    <div className="row" data-missing={missing}>
      {main ? (
        <button className="row-main" type="button" disabled={disabled} aria-label={main.label} onClick={main.onClick}>
          {icon}
          {text}
        </button>
      ) : (
        <>
          {icon}
          {text}
        </>
      )}
      <button className="icon-btn row-hover-action" type="button" disabled={disabled} aria-label={editLabel} onClick={onEdit}>
        <Pencil size={16} />
      </button>
      <button
        className="icon-btn row-hover-action"
        type="button"
        disabled={disabled}
        aria-label={removeLabel}
        onClick={onRemove}
      >
        <X size={18} />
      </button>
      <button
        className="list-toggle"
        type="button"
        disabled={disabled}
        data-on={toggle.on}
        aria-label={toggle.label}
        onClick={toggle.onClick}
      >
        {toggle.icon}
      </button>
    </div>
  )

  if (ghost) return row

  return (
    <SortableRow id={id} kind={kind} label={name} description={dragDescription} disabled={disabled} droppable={droppable}>
      <SwipeRow
        disabled={disabled}
        actions={[
          { label: t('common.edit'), icon: <Pencil size={20} />, tone: 'accent', onSelect: onEdit },
          { label: removeSwipeLabel, icon: <Trash2 size={20} />, tone: 'danger', onSelect: onRemove },
        ]}
      >
        {row}
      </SwipeRow>
    </SortableRow>
  )
}
