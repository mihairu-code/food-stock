# food-stock

A shared home pantry and shopping list, as a PWA for phones. [По-русски](README.ru.md)

Every product has a stock mark: it's at home or it ran out. A *staple* that runs out goes
to the shopping list by itself and comes back to its section once bought. Sections are
your own — "Fridge", "Pantry", "Snacks". Several people share one home and see each
other's changes live.

Stack: React 19 + TypeScript + Vite, React Router, TanStack Query, Supabase
(Postgres + Auth + Realtime), `vite-plugin-pwa`.

## Run

```bash
npm install
npm run dev
```

Without any settings the app starts in **demo mode**: data lives in the browser's
`localStorage`, tabs of the same browser sync with each other. Enough to try every flow.

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm test` | tests: MVP acceptance criteria on the local storage, migrations and RLS on embedded Postgres |
| `npm run build` | type check and build into `dist/` (with manifest and service worker) |
| `npm run preview` | serve the build locally — this is where PWA install can be checked |
| `npm run lint` | oxlint |

## Connect Supabase

1. Create a project on supabase.com.
2. Apply the migrations from `supabase/migrations/` in order — in the SQL Editor or with
   `supabase db push`.
3. Authentication → Sign In / Providers → turn on **Allow anonymous sign-ins**.
4. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (the public key only, never the service-role one).

No email setup is needed: there's no sign-up. A user and a home are created on first
launch, other people join with a one-time link.

## Updates

A deploy replaces only the app files; data stays in Supabase. For a while the old and the
new version work with the same database, so migrations only add, and there's no lazy
loading. The rules are in [decision 0004](docs/en/decisions/0004-safe-updates.md).

## How it's built

```
src/
  domain/     types and pure logic (shopping list, state transitions)
  data/       storage boundary: the Backend interface and two implementations
  app/        gates: who's signed in, which home is open
  screens/    Home, Shopping, Settings
  sheets/     bottom sheets with forms
  components/ small shared pieces
  hooks/      shared hooks
  lib/        small standalone helpers (theme, invite links, emoji suggestions)
supabase/
  migrations/ schema, RLS policies, RPC
  tests/      migrations + RLS checked on PGlite
```

More in [docs/en](docs/en): the [product brief](docs/en/product-brief.md),
[decisions](docs/en/decisions), [release notes](docs/en/releases) and a
[dev diary](docs/en/diary.md).

## License

[MIT](LICENSE)
