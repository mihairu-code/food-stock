import { Lock, type LucideIcon } from 'lucide-react'
import { Mock } from './Mock'
import { Target } from './Target'

/** Адресная строка браузера наверху телефона и кнопка справа от неё: меню ⋮ или «Поделиться». */
export function AddressBarPicture({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Mock place="top">
      <span className="mock-bar">
        <span className="mock-address wide">
          <Lock size={10} /> {window.location.host}
        </span>
        <Target round>
          <span className="mock-icon">
            <Icon size={16} />
          </span>
        </Target>
      </span>
      <span className="mock-page">
        <i className="mock-line" style={{ width: '70%' }} />
        <i className="mock-line" style={{ width: '45%' }} />
      </span>
    </Mock>
  )
}
