# 0007. TanStack Query, not Redux Toolkit / RTK Query

**Status:** accepted · November 2026

## Context

By v0.4 the screens had piled up mutations, sheets and toasts, and they got fat. My
first thought was what I use at work: Redux Toolkit and RTK Query, one store for
everything.

## What actually needs storing

- **Server data** — sections, products, shopping items, members. It's a query cache with
  optimistic edits and Realtime refetches. TanStack Query already does that.
- **The open sheet** and **the current toast** — two tiny values that need to be changed
  from anywhere (a handler, a mutation, code outside components).
- Everything else (theme, language, collapsed sections) is basically settings in
  `localStorage`.

## Options

- **RTK + RTK Query.** Familiar, good devtools. But on top of a cache that already works
  it's a second cache doing the same job, rewriting optimistic updates into
  `onQueryStarted`, and a layer of slices for two values. Plus kilobytes in a bundle that
  loads as a whole ([0004](0004-safe-updates.md)).
- **Zustand / Jotai.** Lighter, but still a new dependency for two values.
- **Stay on TanStack Query and write a tiny store by hand.** `createStore` on
  `useSyncExternalStore` — 30 lines.

## Decision

- Server data — TanStack Query. Mutations move out of screens into `data/hooks`:
  `useCreateProduct`, `useSetProductState`… A screen only calls `mutate`.
- One-off actions without optimism (invites, members, account) — `useAction`: success
  and error toasts and what to refetch are described in one place.
- A toast is a plain function `notify(key, params)`, not a hook: callable from anywhere.
- The open sheet — the same tiny store (next step).

## Consequences

- No Redux devtools; TanStack Query has its own devtools for the cache if needed.
- If client state ever gets complex, Redux is still an option — but not before then.
