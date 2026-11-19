# 0016. Semantic markup instead of div and span

**Status:** accepted · November 2026

## Context

The markup grew out of a prototype where almost everything is a `div` or a `span`. A
screen reader has nothing to lean on: the header, a settings group and a hint all look
the same to it. In places it's plainly an error: there were `div`s inside `<button>` and
`<label>`, where block elements aren't allowed. And the "name + caption" row text was
laid out eight times in eight ways.

## Options

- **Leave it, add `aria-*`.** Works, but `aria` on top of unsuitable tags means more code
  and is easy to get out of sync.
- **Pick tags by meaning**, keep styles on classes so changing a tag doesn't touch the
  look.

## Decision

- The tag follows the meaning: `hgroup` in the header, `section` with a heading for a
  settings group, `aside` for a hint, `p` for a paragraph, `h2` for a card's title. `div`
  is only a layout wrapper, `span` an inline piece with no meaning.
- Inside `button`, `label`, an inline link and `p` — only inline tags (`span`); CSS makes
  them blocks.
- A group of fields without its own label — `role="group"` with `aria-labelledby`:
  `fieldset` with `legend` breaks the field spacing.
- Lists of draggable rows stay `div`: dnd-kit gives a row the `group` role, and an `li`
  with it would stop being a list item.
- Row text is one component, `RowText` (name and caption, optionally as a field's
  `label`); it's used in eight places.
- Styles are on classes, not tags. After replacing tags I compared
  `getBoundingClientRect` and `getComputedStyle` of every element before and after — no
  shifts.

## Consequences

- The same layout with different behavior is one component with parameters (`ListRow`,
  `RowText`), not copies.
- A new element starts with "which tag fits the meaning", not with a `div`.
