import { useEffect, useId, useRef, useState } from 'react'
import { useT } from '@/shared/i18n'
import { finishCoach, type CoachAction, type CoachRequest } from '@/shared/lib/coach/coach'
import { lockPageScroll } from '@/shared/lib/scrollLock'
import { findCoachTarget } from './findCoachTarget'
import { useCoachPlacement } from './useCoachPlacement'

/** Элемент целиком на экране — прокручивать к нему незачем. */
const inView = (element: HTMLElement) => {
  const { top, bottom } = element.getBoundingClientRect()
  return top >= 0 && bottom <= window.innerHeight
}

/**
 * Поставить элемент в середину экрана — сразу, без плавной прокрутки. Плавная на длинном
 * доме не успевала: страница замораживалась на полпути, и вырез оказывался у края экрана
 * или за ним, а с ним и кнопки окна.
 */
function bringIntoView(element: HTMLElement): void {
  if (!inView(element)) element.scrollIntoView({ block: 'center', behavior: 'instant' })
}

/**
 * Окно подсказки или совета поверх всего приложения на нативном <dialog>: фокус внутри,
 * Escape закрывает, остальное затемнено, а элемент, к которому относится подсказка, виден
 * в вырезе. Под модальным окном элемент недоступен, поэтому касание в вырезе ловит окно и
 * поступает по правилу `tap` шага или окна: нажимает элемент или листает шаги. Закрыть
 * окно можно только его кнопкой (или Escape — как «Понятно»): касание мимо ничего не делает,
 * чтобы обучение не терялось от случайного нажатия.
 */
export function CoachWindow({ request }: { request: CoachRequest }) {
  const t = useT()
  const dialog = useRef<HTMLDialogElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const unlock = useRef<(() => void) | null>(null)
  const closed = useRef(false)
  // Нажатие началось мимо пузыря: только такое касание закрывает окно или идёт в вырез.
  const pressedOutside = useRef(false)
  const titleId = useId()
  const textId = useId()
  const [step, setStep] = useState(0)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)

  const current = request.steps[step]
  const count = request.steps.length
  const last = step === count - 1

  function finish(seen: boolean, after?: () => void) {
    if (closed.current) return
    closed.current = true
    // Сначала вернуть прокрутку: шторка, которую откроет нажатие, запомнит настоящее место страницы.
    unlock.current?.()
    unlock.current = null
    dialog.current?.close()
    finishCoach(request.id, { seen })
    if (seen) target?.focus({ preventScroll: true })
    after?.()
  }

  const layout = useCoachPlacement(open ? target : null, bubble, dialog, () => finish(false))

  // Открытие: прокрутить к элементу, заморозить страницу и показать окно.
  useEffect(() => {
    const first = findCoachTarget(request.steps[0].target)
    if (request.steps[0].target && !first) {
      finishCoach(request.id, { seen: false })
      return
    }
    // Сначала элемент на экран, потом заморозить страницу и показать окно.
    const show = () => {
      if (first) bringIntoView(first)
      unlock.current = lockPageScroll()
      dialog.current?.showModal()
      setTarget(first)
      setOpen(true)
    }
    show()
    return () => {
      unlock.current?.()
      unlock.current = null
    }
  }, [request])

  /**
   * Шаг — это свой элемент под вырезом. Шаг, чьего элемента нет на экране, пропускается в
   * ту же сторону: окно само не закрывается. Дальше шагов нет — окно пройдено.
   */
  function goTo(index: number) {
    const direction = index > step ? 1 : -1
    let next = index
    while (next >= 0 && next < count && request.steps[next].target && !findCoachTarget(request.steps[next].target)) {
      next += direction
    }
    if (next >= count) {
      finish(true)
      return
    }
    if (next < 0) return
    const element = findCoachTarget(request.steps[next].target)
    if (element && !inView(element)) {
      // Элемент следующего шага за экраном (кнопка «Новый раздел» внизу, карандаш раздела
      // вверху): страница заморожена, пока открыто окно, — отпускаем, ставим элемент на
      // экран и замораживаем снова.
      unlock.current?.()
      bringIntoView(element)
      unlock.current = lockPageScroll()
    }
    setTarget(element)
    setStep(next)
  }

  // Движение элемента, пока окно открыто (подёргивание строки, тряска лупы).
  useEffect(() => {
    if (!target || !current.motion) return
    target.setAttribute('data-coach-motion', current.motion)
    return () => target.removeAttribute('data-coach-motion')
  }, [target, current.motion])

  const centered = !current.target
  const spot = layout?.spot
  // Пока пузырь не измерен, он невидим, а невидимой кнопке фокус не поставить.
  const placed = centered || layout !== null

  // Фокус — на главную кнопку окна, и заново на каждом шаге.
  useEffect(() => {
    if (open && placed) dialog.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
  }, [open, placed, step])

  const actions: CoachAction[] = last
    ? (request.actions ?? [{ label: t('common.ok'), primary: true }])
    : [{ label: t('coach.next'), primary: true }]

  function runAction(action: CoachAction) {
    if (!last) goTo(step + 1)
    else finish(true, action.run)
  }

  return (
    <dialog
      ref={dialog}
      className="coach"
      data-center={centered || undefined}
      aria-labelledby={current.title ? titleId : textId}
      aria-describedby={current.title ? textId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        finish(true)
      }}
      onPointerDown={(event) => {
        pressedOutside.current = !bubble.current?.contains(event.target as Node)
      }}
      onClick={(event) => {
        if (!pressedOutside.current || bubble.current?.contains(event.target as Node)) return
        const inSpot =
          spot !== undefined &&
          event.clientX >= spot.left &&
          event.clientX <= spot.left + spot.width &&
          event.clientY >= spot.top &&
          event.clientY <= spot.top + spot.height
        if (!inSpot) return
        const tap = current.tap ?? request.tap
        if (tap === 'next' && !last) goTo(step + 1)
        else if (tap === 'press' && target) finish(true, () => target.click())
      }}
    >
      {spot && !centered && (
        <div
          className="coach-spot"
          aria-hidden="true"
          style={{ left: spot.left, top: spot.top, width: spot.width, height: spot.height, borderRadius: layout.radius }}
        />
      )}
      <div
        ref={bubble}
        className="coach-bubble"
        data-side={centered ? undefined : layout?.side}
        data-placed={placed}
        style={centered || !layout ? undefined : { left: layout.left, top: layout.top }}
      >
        {layout?.arrow != null && !centered && (
          <span className="coach-arrow" aria-hidden="true" style={{ left: layout.arrow }} />
        )}
        {request.progress && <p className="coach-progress">{request.progress}</p>}
        {current.title && (
          <h2 id={titleId} className="coach-title">
            {current.title}
          </h2>
        )}
        <p id={textId} className="coach-text">
          {current.text}
        </p>
        <div className="coach-foot">
          {count > 1 && (
            <span className="coach-dots">
              <span className="sr-only">{t('coach.step', { step: step + 1, count })}</span>
              {request.steps.map((_, index) => (
                <span key={index} className="coach-dot" data-current={index === step} aria-hidden="true" />
              ))}
            </span>
          )}
          <div className="coach-actions">
            {step > 0 && (
              <button className="btn subtle small" type="button" onClick={() => goTo(step - 1)}>
                {t('coach.back')}
              </button>
            )}
            {actions.map((action) => (
              <button
                key={action.label}
                className={action.primary ? 'btn small' : 'btn subtle small'}
                type="button"
                data-autofocus={action.primary || undefined}
                onClick={() => runAction(action)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  )
}
