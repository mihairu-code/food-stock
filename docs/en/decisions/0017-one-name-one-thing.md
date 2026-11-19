# 0017. One name, one thing

**Status:** accepted · November 2026

## Context

The shopping list is home products marked "to buy" plus manual items. Nothing stopped
you from adding a manual "Milk" while a "Milk" product already existed at home. Two rows
about the same thing in the list; buy one — the other stays; buy the manual one — a
second "Milk" product appears at home. The duplicate check (v0.9) only looked inside its
own side.

## Options

- **Allow it and show a warning.** The decision stays with the person, but the confusion
  in the list doesn't go away.
- **Forbid equal names outright.** But duplicates already exist in the database from older
  versions, and they need handling too.
- **Treat the home product as the main one:** wherever a name appears, check both sides,
  and merge twins.

## Decision

The home product wins over a manual item:

- adding a manual item when such a product is at home puts that product on the list
  instead; no manual item is created;
- creating or renaming a product when such a manual item is on the list puts the product
  in its place, and the item goes away;
- renaming a manual item to a home product's name isn't allowed — the field says which
  section it's in;
- buying merges twins left by older versions: buy the product — manual items with the
  same name go too; buy a manual item while such a product is at home — the product is
  marked, no second one is created. All of it under one toast with "Undo".

Names are compared ignoring case and extra spaces (`sameName`, `findNamed`). A list entry
knows its twin (`manualTwins` on a product, `homeProduct` on a manual item), so buying
doesn't search for it again.

## Consequences

- Every new path where a name appears is checked on both sides.
- The rules live in the client; the database doesn't forbid twins — an older app version
  can still create them, and buying will merge them.
