# 0010. The sheet above the keyboard follows only the current screen state

**Status:** accepted · November 2026

## Context

On iPhone the keyboard doesn't shrink the page, it lies on top of it. A sheet with an
input has to sit right above the keyboard. In Safari this was solved quickly
(`visualViewport`, v0.6), but in the app opened from the Home Screen the sheet either
sank under the keyboard or flew off past the top edge.

Yesterday's attempt — remember the keyboard height and lift the sheet at least that
much — made it worse. I found the cause from a screen recording with a temporary panel
that printed the numbers from `keyboard.ts` on top of the app:

1. When opening the keyboard, iPhone also **shifts the screen itself up** to show the
   field. The bottom inset is small not because the phone lies, but because the screen
   is already shifted. A remembered height on a shifted screen lifts the sheet hundreds
   of pixels too high — past the top edge.
2. The phone **doesn't always report** the shift: the screen can move once more after
   the last `resize` / `scroll` event. The sheet stayed where the last event left it.

## Options

- **Remembered keyboard height.** Tried — see above.
- **`interactive-widget=resizes-content` in the viewport.** iOS doesn't support it.
- **Sheet at the top of the screen instead of the bottom.** Sidesteps the problem, but
  breaks the familiar gesture and looks out of place on a phone.
- **Compute only from current numbers and re-measure on a timer** while the person types.

## Decision

The sheet's position is a pure function `sheetPlacement` of what the phone reports
right now: screen height, height of the visible part and its offset. No remembered
values.

- Screen height comes from an invisible full-screen probe (`position: fixed; inset: 0`),
  not `window.innerHeight`: its bottom is exactly the bottom the sheet is pinned to.
- The keyboard is "open" if the visible part lost 120 px or more: less than that is
  browser bars. On a shifted screen the inset is small, but the keyboard is still open —
  the form has to tighten up.
- While focus is in an input, and for 1.2 s after a focus change, the numbers are
  re-measured every 80 ms. Styles are touched only when the numbers change.
- The numbers from the recording went into the `keyboard.test.ts` tests.

## Consequences

- The timer runs only while the person types — no noticeable effect on battery.
- The real iPhone keyboard can't be reproduced in tests; changes here have to be checked
  on the phone, in the app from the Home Screen, not in Safari.
