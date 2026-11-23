# iPhone notes

Most of the time on this project went not into features but into how Safari and the
Home Screen app behave. Here's what's worth knowing before touching sheets, forms and
gestures. Details and history are in the [decisions](decisions) and the
[diary](diary.md).

## Keyboard

- **The keyboard lies on top of the page**, it doesn't shrink it. Everything pinned to
  the bottom of the screen ends up under it.
- **When opening the keyboard, iPhone also shifts the screen itself up** to show the
  field. The bottom inset is then small, although the keyboard is open.
- **The phone doesn't always report the shift:** the screen can move once more after the
  last `resize` / `scroll` event.
- So the sheet is computed only from the current `visualViewport.offsetTop` and
  `height` (`lib/keyboard.ts`) and re-measured on a timer while a field has focus. A
  remembered keyboard height doesn't work — the sheet flies off past the top edge
  ([decision 0010](decisions/0010-sheet-from-current-viewport.md)).
- **Safari and the Home Screen app behave differently.** Changes to sheets have to be
  checked in the app opened from the Home Screen.
- Above the keyboard there's room for half a sheet: while it's open, `<html>` has
  `data-keyboard` and the form tightens up.
- **The sheet isn't the only thing standing on the keyboard.** The home search field
  is pinned to it too. Anything like that gets `data-keyboard-anchor`: `keyboard.ts`
  checks where the element's bottom really is and adds the miss to the lift. The
  element's bottom should meet the top of the keyboard, so any gap is better done as
  padding ([decision 0019](decisions/0019-home-search-at-the-bottom.md)).
- **The keyboard opens only if `focus()` runs right inside the tap handler.** After an
  `await`, a timer or a React effect, the field gets focus but no keyboard appears. So a
  field that has to open on a tap is already in the markup: collapsed, with
  `opacity: 0`. A field with `display: none` or `visibility: hidden` can't take focus.
- **A field's font is at least `1rem` (16px)**, or the iPhone zooms the page in on
  focus.
- **Focusing near the bottom edge scrolls the page.** If the iPhone focuses a field
  itself (a tap on it), it scrolls the page to show the field, even though the field
  will stand above the keyboard anyway. The search field takes focus by hand instead:
  `touchend` with `preventDefault` and `focus({ preventScroll: true })`, and the scroll
  is held in place while the keyboard slides in.
- **The page doesn't see the "Done" tick above the keyboard.** All it sees is the field
  losing focus with no touch on the page just before. That's how the home search
  knows to close.

## Focus

- **Buttons and checkboxes in a sheet must not take focus** from the input
  (`onMouseDown={(e) => e.preventDefault()}`), otherwise the keyboard hides and the
  sheet jumps. That's how the section tiles, emoji suggestions and "Always keep at home"
  work.
- The backdrop closes the sheet only if the tap both started and ended on it: the sheet
  can move under the finger.

## What a web app doesn't get

- **A native `<select>` in a sheet** is best avoided: it hides the keyboard, the wheel
  closes with a delay ([decision 0009](decisions/0009-section-tiles-not-select.md)).
- **The emoji keyboard** can't be opened — hence our own icon panel.
- **No vibration:** Safari doesn't support `navigator.vibrate`. It works on Android.
- **The bar above the keyboard** (arrows, "Done") can't be removed or configured.
- **The dimming under the status bar** in iOS 26 is drawn by the system.

## Small things

- An input must be at least 16px, otherwise Safari zooms the page on focus.
- `:active` on iPhone works only if something on the page listens to `touchstart`
  (`lib/pressFeedback.ts`).
- Double tap and pinch zoom the page — turned off in the viewport and in
  `lib/preventZoom.ts`.
- The Home Screen app has its own storage, separate from Safari: sign-in and demo data
  from Safari don't carry over.
- Safari on iPad calls itself a Mac by default — only the touch screen tells it apart
  (`lib/install.ts`).

## How to check

The real iPhone keyboard can't be reproduced in a browser emulator or in tests. What
helps:

- pure functions of the `visualViewport` numbers and tests on numbers taken from the
  phone;
- a temporary panel that prints those numbers on top of the app, plus a screen
  recording — it can be gone through frame by frame.
