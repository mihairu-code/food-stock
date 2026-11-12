# 0008. Drag and drop with dnd-kit, order stored in the database

**Status:** accepted · November 2026

## Context

Products in a section are ordered by when they were added, sections by when they were
created. In practice you want "milk on top, spices at the bottom", and a product put in
the wrong section should be movable to another one. Reordering has to work with a finger
on a phone, a mouse on a computer and a keyboard.

## Options

- **Native HTML5 drag and drop.** Practically doesn't work with touch on iOS Safari.
- **react-beautiful-dnd / @hello-pangea/dnd.** Good for lists, weaker and heavier for
  "a list of lists"; the original is abandoned.
- **dnd-kit.** Sensors for mouse, touch and keyboard, screen reader announcements out of
  the box, list sorting in a separate package. Light.

## Decision

dnd-kit (`core` + `sortable`):

- on touch — a 250 ms hold, otherwise the gesture is a scroll or a delete swipe; with
  a mouse — right away, but only vertically, horizontal movement stays with the swipe;
- from the keyboard: space to pick up, arrows to move, space to drop; the screen reader
  announces what was picked up and where it went.

The order lives in the database (migration `0006`): `products.sort_order` is the place in
the section, `sections.sort_order` already existed. An empty place means "never
reordered", such items follow by creation time, so an older app version that knows
nothing about order breaks nothing. Reordering is the `reorder_products` /
`reorder_sections` RPC, one request per section; moving to another section is the same
call.

Reordering doesn't touch `updated_at`: the shopping list is ordered by it, and dragging
things at home shouldn't shuffle it.

## Consequences

- The delete swipe and dragging share one finger — they need to be kept apart carefully.
- A new dependency in the bundle (~30 KB), but the job can't be done properly without it.
