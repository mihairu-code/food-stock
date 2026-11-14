# 0009. Section tiles instead of the native select

**Status:** accepted · November 2026

## Context

In the add-product sheet the section was picked with a native `<select>`. On iPhone it
goes like this: you type the name, tap the select — the keyboard hides, a wheel slides
up from the bottom, the sheet jumps down. You pick a section — the wheel closes with a
delay, the keyboard is gone, and to finish the name you have to tap the field again. On
Android it's a bit better, but it's still a separate dialog over the sheet.

## Options

- **Keep the `<select>`.** Accessibility for free, but everything above stays.
- **A custom dropdown.** Doesn't hide the keyboard, but it's one more popup inside the
  sheet, and there's little room above the keyboard as it is.
- **A row of tiles with section names** that scrolls sideways. Everything is visible,
  picking is one tap.

## Decision

A row of tiles (`SectionPicker`), semantically a `radiogroup` of `radio`s:

- tapping a tile doesn't take focus from the input (`onMouseDown` with
  `preventDefault`), so the keyboard stays put;
- the selected tile is scrolled into view on open, even if it's at the end of the row;
- the row is marked `data-scroll-x`, so the sheet's close gesture doesn't hijack
  sideways scrolling.

## Consequences

- There are usually fewer than ten sections, the row doesn't grow much. If there are
  many, search will be needed.
- I no longer use the native `<select>` in sheets. In settings (language, theme) it
  stays — there's no input and no keyboard there.
