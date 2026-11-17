# Contributing

Notes for whoever touches this code next — mostly for me in a month. [По-русски](CONTRIBUTING.ru.md)

## Before saying "done"

```bash
npm test
npm run lint
npm run build
```

All three. Then check the change in the browser in demo mode (no Supabase keys — data
lives in `localStorage`). If it touches sheets, forms or gestures, check it on a phone,
in the app opened from the Home Screen — see [iPhone notes](docs/en/ios-notes.md).

## Code

- **Layers (FSD).** A layer imports only lower layers, slices of one layer don't know
  each other, from outside a slice is reached through its `index.ts`.
  `src/app/fsdBoundaries.test.ts` fails on a violation.
- **One file — one component.** Hooks and functions go to `model/` or `lib/`.
- **Imports from the root via `@/`** and through a slice's public API
  (`@/entities/product`); inside a slice — relative.
- **Reuse, don't re-layout.** A form in a sheet is `FormSheet`; name with icon is
  `NameIconFields`; section choice is `SectionPicker`; a settings row is `SettingRow` /
  `SettingSelect` / `SettingToggle`; a draggable row is `SortableRow`; swipe to delete
  is `SwipeRow`. The same element should look the same everywhere.
- **Sheets** are rendered only by `SheetHost`. A screen calls `openSheet({ type: … })`.
  A new sheet: a component in `features/…`, a variant in `SheetRequest`
  (`shared/ui/sheet/sheetStore.ts`), a line in `app/sheets/SheetHost.tsx`.
- **Toast** — `notify('key', params)`; it's a function, not a hook.
- **Mutations** live in `entities/*/api` together with the error toast and cache
  refetch. A component only calls `mutate`. Home data is edited through
  `useHomeMutation` (optimistic, strictly in order).
- **A new storage method** goes into `shared/api/backend.ts`, both implementations and
  the tests (`src/app/homeFlows.test.ts`).
- **Styles** — a file next to its layer, imported in `app/styles/index.css`. Sizes in
  `rem` from the scales in `tokens.css`; `px` only for borders, shadows and outlines.
- **Texts** — a key in `ru.ts` and the same keys in the other three dictionaries,
  otherwise `i18n.test.ts` fails.
- **Colors** — only through variables (`--accent`, `--paper`, `--ink`…); theme and
  accent are the `data-theme` and `data-accent` attributes on `<html>`.
- Comments explain "why", not "what". No `console.log`.

## What must not break

For a while the old version keeps running on phones against the same database.

- **Migrations only add.** Don't drop or rename tables, columns, functions; don't change
  the parameters of existing RPCs — add a new function.
- **Migration first, deploy second.** The app asks for the new columns.
- **Don't rename the `home-stock:*` keys** in `localStorage` (session, home, name,
  language, theme, accent, hints).
- **No `React.lazy` and no dynamic `import()`** — see
  [decision 0004](docs/en/decisions/0004-safe-updates.md).
- **Changing the shape of home data** — bump `VERSION` in `shared/api/snapshot.ts`.
- **Data access only through RLS.** A new table without a policy is a hole.

## Docs

A notable decision gets a short record in `docs/*/decisions` (context, options, decision,
consequences). Each release gets notes in `docs/*/releases` and a line in
`CHANGELOG.md`. Russian and English are kept in sync.
