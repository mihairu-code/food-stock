import type { ReactNode } from 'react'
import { useT } from '@/shared/i18n'
import { closeSheet } from './sheetStore'

interface SheetActionsProps {
  /** Основная кнопка (или кнопки) справа от «Отмены». */
  children: ReactNode
  /** Подпись кнопки, которая просто закрывает шторку; по умолчанию «Отмена». */
  closeLabel?: string
  /** Фокус сразу на закрывающей кнопке — в подтверждениях опасных действий. */
  focusClose?: boolean
}

/** Нижний ряд кнопок любой шторки: закрыть и основное действие. Везде выглядит одинаково. */
export function SheetActions({ children, closeLabel, focusClose = false }: SheetActionsProps) {
  const t = useT()
  return (
    <div className="sheet-actions">
      {/* autoFocus у элементов шторки не работает: она ещё скрыта, когда React ставит фокус.
          Фокус по просьбе ставит сама шторка после открытия (см. Sheet). */}
      <button className="btn subtle" type="button" onClick={closeSheet} data-autofocus={focusClose || undefined}>
        {closeLabel ?? t('common.cancel')}
      </button>
      {children}
    </div>
  )
}
