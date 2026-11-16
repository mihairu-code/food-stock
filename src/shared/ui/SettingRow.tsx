import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface SettingRowProps {
  title: ReactNode
  meta?: ReactNode
  /** Слева от текста: аватар или эмодзи. */
  leading?: ReactNode
  /** Справа от текста. У строки-действия по умолчанию стоит шеврон. */
  trailing?: ReactNode
  /** Строка-ссылка на другой экран. */
  to?: string
  /** Строка-кнопка. */
  onClick?: () => void
  disabled?: boolean
  /** Опасное действие: красный текст, без шеврона. */
  danger?: boolean
}

/** Строка настроек: ссылка, кнопка или просто сведения — смотря что передали. */
export function SettingRow({ title, meta, leading, trailing, to, onClick, disabled, danger }: SettingRowProps) {
  const isAction = Boolean(to || onClick)
  const className = danger ? 'setting-row danger' : 'setting-row'
  const body = (
    <>
      {leading}
      <div className="row-text">
        <div className="row-name">{title}</div>
        {meta && <div className="row-meta">{meta}</div>}
      </div>
      {trailing ?? (isAction && !danger && <ChevronRight className="chevron" size={18} aria-hidden="true" />)}
    </>
  )

  if (to) {
    return (
      <Link className={className} to={to}>
        {body}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button className={className} type="button" disabled={disabled} onClick={onClick}>
        {body}
      </button>
    )
  }
  return <div className={className}>{body}</div>
}
