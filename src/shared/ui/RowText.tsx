import type { ReactNode } from 'react'

interface RowTextProps {
  title: ReactNode
  meta?: ReactNode
  /** id названия — когда строка подписывает соседний элемент (aria-labelledby). */
  titleId?: string
  /** id поля, которое подписывает текст: тогда это <label>, и нажатие на текст переключает поле. */
  labelFor?: string
}

/**
 * Название строки и подпись под ним. Внутри span: текст стоит и в кнопках и подписях,
 * где блочные теги недопустимы; блоками их делают стили.
 */
export function RowText({ title, meta, titleId, labelFor }: RowTextProps) {
  const content = (
    <>
      <span className="row-name" id={titleId}>
        {title}
      </span>
      {meta && <span className="row-meta">{meta}</span>}
    </>
  )
  return labelFor ? (
    <label className="row-text" htmlFor={labelFor}>
      {content}
    </label>
  ) : (
    <span className="row-text">{content}</span>
  )
}
