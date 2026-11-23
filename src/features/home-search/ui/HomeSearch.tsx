import { Search, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { useT } from '@/shared/i18n'
import { closeHomeSearch, openHomeSearch, setHomeSearchQuery, useHomeSearch } from '../model/homeSearch'

const INPUT_ID = 'home-search-input'
/** Сколько после нажатия на лупу клавиатура ещё выезжает и iPhone может двигать страницу. */
const KEYBOARD_SETTLE_MS = 800

/**
 * Держит прокрутку страницы на месте, пока выезжает клавиатура: iPhone, фокусируя поле
 * у нижнего края, сам прокручивает страницу, чтобы показать его, хотя поле и так встанет
 * над клавиатурой. Касание или ввод отменяют удержание — дальше прокручивает человек.
 * Возвращает отмену.
 */
function holdPageScroll(): () => void {
  const y = window.scrollY
  const keep = () => {
    if (window.scrollY !== y) window.scrollTo(0, y)
  }
  const release = () => {
    window.clearTimeout(timer)
    window.removeEventListener('scroll', keep)
    document.removeEventListener('touchstart', release)
  }
  const timer = window.setTimeout(release, KEYBOARD_SETTLE_MS)
  window.addEventListener('scroll', keep)
  document.addEventListener('touchstart', release, { passive: true })
  return release
}

/**
 * Чем человек управляет сейчас: пальцем или мышью — или клавиатурой. Фокус на лупу после
 * закрытия возвращается только для клавиатуры: после касания браузер обвёл бы лупу
 * рамкой фокуса, а на телефоне она там ни к чему.
 */
let usingPointer = true
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => (usingPointer = true), { capture: true, passive: true })
  document.addEventListener('keydown', () => (usingPointer = false), { capture: true, passive: true })
}

/** Фокус в поле ввода или открыта шторка: «/» и Esc там значат своё. */
const busyWithOtherInput = (target: EventTarget | null) =>
  document.querySelector('dialog[open]') !== null ||
  (target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select')))

/**
 * Поиск по дому у нижней панели: круглая лупа, которая растягивается в поле.
 *
 * Поле лежит в разметке всегда, свёрнутое и прозрачное: iPhone показывает клавиатуру,
 * только если focus() вызван прямо в обработчике нажатия, а скрытое через display или
 * visibility поле сфокусировать нельзя. Как сворачиваются вкладки — решает панель
 * (data-search-open), здесь только сама лупа и поле.
 */
export function HomeSearch({ available }: { available: boolean }) {
  const t = useT()
  const { open, query, restoreScroll } = useHomeSearch()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const releaseScroll = useRef<() => void>(undefined)

  function startSearch() {
    openHomeSearch()
    releaseScroll.current?.()
    releaseScroll.current = holdPageScroll()
    // Синхронно, в том же нажатии: иначе iPhone не откроет клавиатуру.
    inputRef.current?.focus({ preventScroll: true })
  }

  function changeQuery(next: string) {
    releaseScroll.current?.()
    setHomeSearchQuery(next)
    // Результаты — сразу под шапкой, а не там, где был список до ввода.
    window.scrollTo(0, 0)
  }

  function closeOnEscape(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape') return
    // Иначе браузер только очистит поле type="search".
    event.preventDefault()
    closeHomeSearch()
  }

  // Закрыли поиск на «Доме» — список, прокрутка и фокус возвращаются туда, где были.
  // До отрисовки: полный список сразу появляется на прежнем месте, без кадра сверху.
  // Закрыли касанием — фокус просто уходит из поля (клавиатура прячется), без рамки на лупе.
  const wasOpen = useRef(open)
  useLayoutEffect(() => {
    if (wasOpen.current && !open) {
      releaseScroll.current?.()
      if (restoreScroll !== null) {
        window.scrollTo(0, restoreScroll)
        if (usingPointer) inputRef.current?.blur()
        else toggleRef.current?.focus({ preventScroll: true })
      }
    }
    wasOpen.current = open
  }, [open, restoreScroll])

  // «/» открывает поиск с клавиатуры компьютера, Esc закрывает, где бы ни был фокус.
  useEffect(() => {
    if (!available) return
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (busyWithOtherInput(event.target)) return
      if (event.key === '/' && !open) {
        event.preventDefault()
        startSearch()
      } else if (event.key === 'Escape' && open) {
        closeHomeSearch()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [available, open])

  // Прокрутка списка пальцем убирает клавиатуру: поле с запросом остаётся внизу,
  // нажатие на него вернёт клавиатуру. Именно касание, а не scroll: iPhone сам
  // прокручивает страницу, открывая клавиатуру, и поле тут же теряло бы фокус.
  useEffect(() => {
    if (!open) return
    function blurOnListScroll(event: TouchEvent) {
      const input = inputRef.current
      if (input && document.activeElement === input && !formRef.current?.contains(event.target as Node)) {
        input.blur()
      }
    }
    document.addEventListener('touchmove', blurOnListScroll, { passive: true })
    return () => document.removeEventListener('touchmove', blurOnListScroll)
  }, [open])

  return (
    <form
      ref={formRef}
      className="tab home-search"
      role="search"
      data-available={available}
      // Лупы не видно (другая вкладка, мало продуктов) — её нет ни для пальца, ни для скринридера.
      inert={!available}
      // Отправлять нечего: «Найти» на клавиатуре телефона просто убирает её.
      onSubmit={(event) => {
        event.preventDefault()
        inputRef.current?.blur()
      }}
    >
      <button
        ref={toggleRef}
        className="home-search-toggle"
        type="button"
        aria-label={t('search.label')}
        aria-expanded={open}
        aria-controls={INPUT_ID}
        tabIndex={open ? -1 : 0}
        onClick={startSearch}
      >
        <Search size={24} aria-hidden="true" />
      </button>
      <input
        ref={inputRef}
        id={INPUT_ID}
        className="home-search-input"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={t('search.label')}
        placeholder={t('search.placeholder')}
        maxLength={80}
        tabIndex={open ? 0 : -1}
        value={query}
        onChange={(event) => changeQuery(event.target.value)}
        onKeyDown={closeOnEscape}
      />
      {open && (
        <button
          className="home-search-clear"
          type="button"
          aria-label={t('search.clear')}
          onClick={() => closeHomeSearch()}
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </form>
  )
}
