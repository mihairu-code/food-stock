# Changelog

## 0.2.0 — 2026-11-10

- No sign-up: an anonymous user and a home are created on first launch.
- One-time invite links (7 days, stored as a hash), revoke, join by pasting a link.
- Member display names; the owner can remove members.
- Emoji suggestions by product name.
- Optimistic updates with rollback and toasts; client-generated ids.
- Memoized rows, batched realtime refetch, screen and section transitions.
- Vercel config; demo mode for automated browsers; `noindex`.
- Email sign-in and email invites removed.

## 0.1.0 — 2026-11-08

First working version (MVP).

- Custom sections: create, rename, delete (a non-empty one only after confirmation).
- Staple and one-off products with emoji and a stock mark.
- Shopping list built from staples that ran out plus manual items.
- "Bought" on a manual item asks for a section and can make it a staple.
- Swipe to delete, with a button for keyboard and screen reader users.
- Light and dark theme.
- Supabase: schema with row level security, email code sign-in, a shared home,
  email invites, live sync between members.
- PWA: manifest, icons, cached app shell.
- Demo mode in `localStorage` when Supabase isn't configured.
