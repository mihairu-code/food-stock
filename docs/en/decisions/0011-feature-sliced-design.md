# 0011. Structure by Feature-Sliced Design

**Status:** accepted · November 2026

## Context

In two weeks the code grew to a hundred-plus files in folders by type: `components`,
`screens`, `sheets`, `data/hooks`, `lib`, `domain`. To fix, say, buying a manual item,
you open five folders. `components` mixes a settings row button with the "always keep
at home" checkbox that knows about products. Nothing limits who can import whom, and
`lib` has already started pulling data.

## Options

- **Keep folders by type, tidy up inside.** Cheap, but "who knows whom" stays.
- **By screen (`home/`, `shopping/`, `settings/`), shared stuff in `common/`.** Good for
  screens, but sheets and entities are used from several screens, and `common/` quickly
  becomes the next dump.
- **Feature-Sliced Design.** Layers `app → pages → widgets → features → entities →
  shared`, a layer imports only lower ones, slices of one layer don't know each other,
  from outside only through `index.ts`. The rules are well known and easy to check
  automatically.

## Decision

FSD:

- `shared` — whatever doesn't know about products and homes: API client and cache, i18n,
  small libraries, shared UI elements, sheets as a mechanism;
- `entities` — product, section, manual item, shopping list, member, invite, home: their
  queries, mutations, rules and small elements;
- `features` — forms in sheets: add a product, buy an item, join a home…;
- `widgets` — the header and the bottom tabs;
- `pages` — screens;
- `app` — startup, providers, routes, the layout and `SheetHost`.

Boundary violations are caught by `fsdBoundaries.test.ts`: importing upwards, between
slices of one layer, and around a slice's `index.ts`.

The move happens in three steps so that each one builds: first `shared` and `entities`,
then `features`, `widgets` and `pages`, then `app`, slice public APIs and renames.

## Consequences

- More folders and `index.ts` files, but it's clear where to look and what's safe to touch.
- A slice is a boundary: if two features need something shared, it goes down to
  `entities` or `shared`.
- Names that mean something in the project (`saveProduct`, `deleteSectionNow`) instead of
  generic ones (`submit`, `remove`).
