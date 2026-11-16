import { X } from 'lucide-react'
import type { ReactNode } from 'react'
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
  /** Кнопка справа: плюс/минус на «Доме», «Куплено» в покупках (text — подпись вместо иконки). */
  toggle: { label: string; icon: ReactNode; on?: boolean; text?: boolean; onClick: () => void }
  /** Подпись крестика для скринридера и подложки свайпа. */
  removeLabel: string
  removeSwipeLabel: string
  onRemove: () => void
}

/**
 * Строка списка продуктов — одна и на «Доме», и в покупках: иконка, название с подписью
 * и кнопка справа. Свайп влево удаляет; мышью и с клавиатуры — крестик, который
 * появляется при наведении. Строку можно перетащить на другое место.
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
  removeLabel,
  removeSwipeLabel,
  onRemove,
}: ListRowProps) {
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
      <button
        className={toggle.text ? 'btn small' : 'list-toggle'}
        type="button"
        disabled={disabled}
        data-on={toggle.on}
        aria-label={toggle.label}
        onClick={toggle.onClick}
      >
        {toggle.icon}
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
    </div>
  )

  if (ghost) return row

  return (
    <SortableRow id={id} kind={kind} label={name} description={dragDescription} disabled={disabled} droppable={droppable}>
      <SwipeRow onDelete={onRemove} label={removeSwipeLabel} disabled={disabled}>
        {row}
      </SwipeRow>
    </SortableRow>
  )
}
