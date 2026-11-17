# 0014. Delete with undo instead of a confirmation

**Status:** accepted · November 2026

## Context

Deleting a product or a shopping line is final and asks nothing: a swipe or a cross,
and it's gone. With the swipe buttons and the hover cross, deleting by accident got
easier, and a long swipe that deletes by itself is coming. There's no way to get it back.

## Options

- **A confirmation before deleting.** Reliable, but deleting is frequent, and a question
  every time quickly teaches you to hit "Yes" without looking.
- **A server-side trash (soft delete).** Restore any time, but that's a new column, a
  filter in every query, RLS, cleanup — a lot for an "oops, not that one".
- **A delayed request and "Undo" in the toast.** The record disappears from the screen
  right away, the request goes to the server later. Until it does, undo is possible, and
  the server has nothing to restore.

## Decision

`removeWithUndo` (`shared/api/pendingRemovals.ts`):

- the record is hidden immediately — `useHomeData` returns the data without it;
- a toast with "Undo" stays for 5 s; the request goes out when the toast closes, on the
  next delete, on any other edit (it was computed against a screen without the deleted
  record and must queue after the delete on the server) or when the app is backgrounded —
  the phone may unload it;
- "Undo" simply shows the record again — in its old place, since nobody touched it on
  the server;
- after sending, the record stays hidden until the response: the optimistic cache edit
  isn't instant, and the row would flash.

"Remove from the list without buying" works the same way — the product stays at home.

## Consequences

- Other members see the deletion ~5 s later.
- Deleting from a row goes only through `removeWithUndo`; the UI never calls a delete
  `mutate` directly.
