import type { ReactElement } from 'react'
import type { LoadingKind } from '@/shared/lib/loadingKind'

/*
 * Встроенный SVG и CSS-анимация (statusNote.css): без библиотек и картинок, цвета —
 * токенами, поэтому картинка следует теме и акценту. Движутся только transform и opacity.
 */
const PICTURES: Record<LoadingKind, ReactElement> = {
  fridge: (
    <>
      <rect className="loading-body" x="11" y="3" width="26" height="42" rx="4" />
      <path className="loading-shelf" d="M14 26h20M14 35h20" />
      <rect className="loading-food" x="16" y="20" width="5" height="6" rx="1" />
      <circle className="loading-food" cx="28" cy="32" r="3" />
      <rect className="loading-food" x="17" y="38" width="12" height="5" rx="1" />
      <g className="loading-door">
        <rect x="11" y="17" width="26" height="28" rx="4" />
        <path d="M16 23v6" />
      </g>
      <path className="loading-seam" d="M11 16h26" />
    </>
  ),
  shelves: (
    <>
      <path className="loading-frame" d="M6 4v40M42 4v40M6 22h36M6 42h36" />
      <rect className="loading-item" x="10" y="9" width="7" height="11" rx="1.5" />
      <rect className="loading-item loading-step-1" x="20" y="13" width="9" height="7" rx="1.5" />
      <circle className="loading-item loading-step-2" cx="34" cy="16" r="4" />
      <rect className="loading-item loading-step-3" x="11" y="29" width="6" height="11" rx="2" />
      <rect className="loading-item loading-step-4" x="21" y="32" width="15" height="8" rx="1.5" />
    </>
  ),
  list: (
    <>
      <rect className="loading-box" x="5" y="7" width="9" height="9" rx="2" />
      <rect className="loading-box" x="5" y="20" width="9" height="9" rx="2" />
      <rect className="loading-box" x="5" y="33" width="9" height="9" rx="2" />
      <rect className="loading-tick" x="7.5" y="9.5" width="4" height="4" rx="1" />
      <rect className="loading-tick loading-step-1" x="7.5" y="22.5" width="4" height="4" rx="1" />
      <rect className="loading-tick loading-step-2" x="7.5" y="35.5" width="4" height="4" rx="1" />
      <path className="loading-text" d="M20 11.5h22" />
      <path className="loading-text loading-step-1" d="M20 24.5h16" />
      <path className="loading-text loading-step-2" d="M20 37.5h19" />
    </>
  ),
}

/**
 * Картинка загрузки: холодильник, полки или список покупок. Для скринридера её нет:
 * состояние называет текст рядом.
 */
export function LoadingPicture({ kind }: { kind: LoadingKind }) {
  return (
    <svg className="loading-picture" data-kind={kind} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {PICTURES[kind]}
    </svg>
  )
}
