# 0013. Realtime changes go straight into the cache, tabs stay mounted

**Status:** accepted · November 2026

## Context

Two things that felt slow on the phone.

1. **Other people's changes.** Any Realtime event refetched the whole cache: sections,
   products, shopping, members. Someone marks the milk — everyone else fires five
   requests, and the screen shows the old state for a moment until they come back.
2. **Switching tabs flickered.** The screen was recreated (`key={pathname}`), an enter
   animation with `opacity: 0` played, Home with dnd-kit took noticeable time to build,
   and the scroll jumped: go back to Home — it's at the top again.

## Options

For changes:

- **Keep refetching, but less often.** Fewer requests, but the screen still lags.
- **Put the incoming row straight into the cache.** Postgres Changes sends the whole row
  for inserts and updates and the id for deletes — that's enough.

For tabs:

- **A.** Drop the animation and the recreation — less flicker, but Home is still rebuilt
  and the scroll is lost.
- **B.** Keep Home and Shopping mounted, hide the inactive one, each with its own scroll.
- **C.** View Transitions — in Safari they're uneven with fixed elements (header, tabs).

## Decision

- `useRealtimeSync`: a section, product or manual item row goes into its home's cache;
  a deleted one is removed by id. Events within 150 ms are handled as one batch. While
  our own edits are in flight and for 2 s after, an event may be an echo of our own
  edit and bring back an old state — such events aren't applied, they refetch only the
  affected table. Changes to homes, members and invites also refetch just their part.
  After a reconnect, the home is refetched entirely: events were lost while offline.
- Tabs — option B without animation: Home and Shopping are rendered by the layout itself,
  the inactive one is `hidden` (invisible, unreachable by focus and screen readers). Each
  tab's scroll is remembered at the moment of navigation, not on the `scroll` event: by
  then the old screen is already hidden and the scroll clamped to the new height.

## Consequences

- Someone else's change shows up immediately and without extra requests.
- Both tabs live in memory — a couple hundred rows; unnoticeable on a phone.
- The echo logic relies on timing; if edits start getting lost, look here first.
