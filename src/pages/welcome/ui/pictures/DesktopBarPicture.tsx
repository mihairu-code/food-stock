import { EllipsisVertical, Lock, MonitorDown } from 'lucide-react'
import { Mock } from './Mock'
import { Target } from './Target'

/** Окно браузера на компьютере: значок установки в правом конце адресной строки. */
export function DesktopBarPicture() {
  return (
    <Mock place="top">
      <span className="mock-window">
        <span className="mock-tabs">
          <i />
          <i />
          <i />
          <span className="mock-tab" />
        </span>
        <span className="mock-bar">
          <span className="mock-address wide">
            <Lock size={10} /> {window.location.host}
            <Target round>
              <span className="mock-icon small">
                <MonitorDown size={13} />
              </span>
            </Target>
          </span>
          <span className="mock-icon">
            <EllipsisVertical size={15} />
          </span>
        </span>
      </span>
      <span className="mock-page">
        <i className="mock-line" style={{ width: '60%' }} />
        <i className="mock-line" style={{ width: '40%' }} />
      </span>
    </Mock>
  )
}
