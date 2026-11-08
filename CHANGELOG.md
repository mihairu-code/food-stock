# Changelog

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
