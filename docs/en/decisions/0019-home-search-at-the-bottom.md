# 0019. Home search at the bottom: a separate search button by the tab bar

**Status:** accepted · November 2026

## Context

A product row is about 60 pt. A home with 40 products in six sections is 4–5 screens of
scrolling. People mostly open Home to check whether something is there, or to mark that
it ran out. Either way they look a product up by name. A field at the top of the screen
is far from the thumb, and the tab bar must look the same on every screen.

## Options

- **A field at the top instead of the "N items at home" counter.** Familiar, but you
  have to reach across the whole screen, and the counter is useful.
- **Search as a fourth tab button.** Four buttons on Home, three elsewhere: the bar
  jumps when you switch tabs.
- **A corner menu.** It covers the plus buttons in the rows and is awkward for
  left-handers.
- **"Find or add" in the Add sheet.** A product with the same name can't be added
  anyway ([decision 0017](0017-one-name-one-thing.md)), so this is the same search,
  only hidden.
- **Gestures** (pull the list, swipe the bar). Nobody would find them.
- **A separate round search button right of the bar.** Tapping it folds the tabs into
  the Home button and stretches the search button into a field above the keyboard, like
  the search in the iOS 26 tab bar.

## Decision

The separate search button. It shows only on Home, and only with 12 or more products:
below that, the home fits in a couple of screens anyway.

- **A row of five places:** empty, three tabs, search. The empty place balances the
  search button, so the tabs stay centred in the app column and don't move when the
  button appears or disappears.
- **Button size** is what each of the five places gets, taken from the column width.
  It is capped at the old 3.625rem and floored at 44px. The floor has to be px, and it
  is the only such place: rem grows with the browser font while the screen doesn't, so
  at 200% a 2.75rem floor is already 88px, and not even three tabs fit on a 320 screen.
  Side padding and gaps shrink with the screen too. So the row fits whole on any screen
  wider than 275px, and the search button never has to move above the bar. The original
  plan had that as a fallback through a container query; it wasn't needed.
- **The field is always in the markup**, collapsed and transparent. The iPhone opens the
  keyboard only if `focus()` runs right inside the tap handler.
- **Above the keyboard the row stands** on `--keyboard-inset`. It has
  `data-keyboard-anchor`, and `keyboard.ts` checks its position the same way it used to
  check the sheet's ([decision 0010](0010-sheet-from-current-viewport.md)).
- **The filter is a pure function, `matchProductsByName`.** Case and `ё`/`е` don't
  matter, and Latin diacritics are stripped (`pho` finds `phở`). Cyrillic and Japanese
  aren't decomposed, or `й` would become `и`. Order: a match at the start of the name
  first, then at the start of a word, then in the middle.
- **While searching**, sections without matches are hidden and the ones with matches are
  open. Dragging is off: in a filtered list you can't see where a row would land. When
  nothing is found, "Add «…»" opens the add sheet with the name ready.

## Consequences

- On a 320 screen at the default font the tabs are 51px instead of 58. At 375 and wider
  nothing changed.
- Anything new pinned to the keyboard gets `data-keyboard-anchor`, and the self-check in
  `keyboard.ts` covers it. An open sheet wins.
- Search works on the data already loaded, with no server requests. Changes from other
  members show up in the results right away.
- There's no search in Shopping or in Settings.
