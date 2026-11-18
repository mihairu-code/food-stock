/**
 * Временная панель с числами клавиатуры поверх приложения — чтобы снять их с телефона
 * записью экрана. Включается переменной сборки VITE_KEYBOARD_DEBUG=1, в обычной сборке
 * её нет. Флаг именно при сборке, а не в адресе: у приложения на экране «Домой» своё
 * хранилище, и параметр, открытый в Safari, туда не доходит.
 */
export function showKeyboardDebug(): void {
  const viewport = window.visualViewport
  if (!viewport) return

  const panel = document.createElement('pre')
  panel.style.cssText =
    'position:fixed;top:env(safe-area-inset-top);left:0;z-index:9999;margin:0;padding:4px 6px;' +
    'background:rgb(0 0 0 / 72%);color:#7cff7c;font:11px/1.35 ui-monospace,monospace;pointer-events:none'
  // Своя мерка во весь экран — те же числа, что видит keyboard.ts.
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none'
  document.body.append(panel, probe)

  const round = (value: number) => Math.round(value * 10) / 10

  function render() {
    const frame = probe.getBoundingClientRect()
    const root = document.documentElement
    const css = getComputedStyle(root)
    const sheet = document.querySelector('dialog.sheet[open]')?.getBoundingClientRect()
    panel.textContent = [
      `probe top ${round(frame.top)} bottom ${round(frame.bottom)} h ${round(frame.height)}`,
      `inner ${window.innerHeight} vv.h ${round(viewport!.height)} vv.top ${round(viewport!.offsetTop)}`,
      `inset ${css.getPropertyValue('--keyboard-inset')} visible ${css.getPropertyValue('--visible-height')}`,
      `keyboard ${root.hasAttribute('data-keyboard')}`,
      sheet ? `sheet top ${round(sheet.top)} bottom ${round(sheet.bottom)}` : 'sheet —',
    ].join('\n')
  }

  window.setInterval(render, 100)
  render()
}
