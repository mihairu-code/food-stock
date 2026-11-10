# 0004. Rules for safe updates

**Status:** accepted · November 2026

## Context

The app is deployed on Vercel and real people use it. A deploy only replaces the app
files; the data lives in Supabase and "who am I" lives in browser storage on the device.
But after a deploy the **old and new versions run against the same database at the same
time** for a while: the PWA downloads the update in the background and shows it only on
the next launch, and some people keep the app open for days.

Migration `0003` still dropped tables and functions — the database was empty back then.
That's over now.

## Decision

1. **Migrations only add.** Don't drop or rename tables, columns, functions; don't change
   the parameters of an existing RPC — add a new function.
2. **Migration first, deploy second.** New code asks for new columns.
3. **The old version must keep working** on the new schema: if it writes the old way,
   the database brings the data up to the new rule by itself (a trigger).
4. **`home-stock:*` keys in `localStorage` are never renamed** — otherwise a person
   "forgets" their home, theme, name.
5. **No `React.lazy` and no dynamic `import()`.** An old tab will ask for a chunk that's
   no longer on the server after a deploy, and crash.
6. **The site address and the Supabase project don't change** — on a new address everyone
   becomes a new anonymous user without a home.

## Consequences

- The schema will grow "historical" columns and functions — that's the price.
- All code ships in one bundle. Libraries can go into separate files, but they have to be
  loaded up front, not lazily.
