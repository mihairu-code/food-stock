# 0006. In stock and "to buy" are two independent marks

**Status:** accepted · November 2026

## Context

In v0.1–v0.3 the shopping list was computed: "a staple ran out" = "it needs buying".
The brief already wanted more, but it didn't fit into the MVP, and in practice it gets
in the way:

- you can't put on the list something that's still there but about to run out;
- you can't leave a product that ran out and not buy it;
- removing a product from shopping only worked by deleting it from the home;
- a one-off couldn't "run out" — only disappear.

## Options

- **A separate shopping table with references to products.** Flexible, but I'd have to
  watch for duplicates and deletion — exactly what I avoided in v0.1.
- **A `to_buy` flag on the product.** The list stays computed (`to_buy` plus manual
  items), there's nowhere for a duplicate to come from.

## Decision

A `products.to_buy` flag:

- at home — a stock dot on the icon (tap the product) and a separate "+ / −" button;
- a staple that runs out still goes to shopping by itself and leaves it once it's back
  home; a one-off only via the plus;
- in shopping a product shows "at home" or "ran out"; a swipe removes it from the list
  without touching the product.

Migration `0005` carries over everything that was on the list and adds a trigger: older
versions only send `is_available`, and for them `to_buy` follows stock by the old rule.

## Consequences

- The "ran out → to shopping" rule lives both on the client (`withAvailability`) and in
  the trigger. They have to stay identical.
- The "a one-off is always at home" constraint is dropped — that loosens a rule rather
  than deleting data, so it doesn't break [0004](0004-safe-updates.md).
