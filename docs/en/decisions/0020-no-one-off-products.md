# 0020. No one-off products: whatever runs out goes on the list by itself

**Status:** accepted · November 2026

## Context

From the start a product came in two kinds ([brief, "Key decisions", item 2](../product-brief.md)):
a *staple* goes on the shopping list by itself when it runs out, and a *one-off* only by
the plus button. Since [decision 0006](0006-independent-stock-and-to-buy.md) a product
has two independent marks, so the kinds differed in one thing only: what happens on
"ran out".

In practice the choice confuses people. The "Always keep at home" checkbox in the add
sheet makes you think about a product in advance, before it has run out. The "One-off"
caption under a row doesn't explain why the product didn't show up on the list. And
the cases the kind was meant for are covered without it:

- a one-time purchase doesn't have to be added to the home: a manual item has "Don't
  add to home";
- a product that ran out doesn't have to be bought: minus takes it off the list and it
  stays "ran out, not on the list";
- a product nobody needs any more gets deleted.

## Options

- **Keep the kinds, make "staple" the default.** Fewer taps, but the choice and the
  caption stay, and with them the "which kind is this" question.
- **Drop the choice from the UI, keep the kind in the data.** Every product behaves the
  same; the column lives on for older versions.

## Decision

There's no kind to choose. Every product behaves like a former staple: it goes on the
list when it runs out and leaves the list when it's back home. The app no longer uses the
words "staple" and "one-off".

- The "Always keep at home" and "Make it a staple" checkboxes are gone, together with
  `StapleCheckbox`. The toasts for buying a manual item are merged into one.
- `withAvailability(available)` no longer looks at the product: "ran out" always means
  `to_buy = true`.
- Minus and the "ran out, not on the list" state are unchanged.
- The "Always at home" and "One-off" row captions are replaced by the state: "At home",
  "On the list · still home", "Ran out", "Ran out · on the shopping list". "At home since
  18 November" was dropped: the date can't know about purchases made outside the app, and
  milk is often restocked before it runs out, so the date would be wrong exactly for
  perishables. "Running low" for the orange dot was dropped too: people add things to the
  list both to stock up and for a recipe.
- Whoever doesn't need captions turns on the minimal view: no captions, shorter rows. The
  stock dot position is a setting too.

Compatibility, per [decision 0004](0004-safe-updates.md):

- the `products.kind` column stays: older versions still work with the same database;
- the new client writes `kind = 'staple'` into every new product (`NEW_PRODUCT_KIND`)
  and leaves the field alone on edit; it doesn't read `kind` of existing products;
- RPC parameters are unchanged: buying a manual item passes `p_make_staple = true`;
- the `products_sync_to_buy` trigger stays as it was. The new client changes `to_buy`
  together with stock itself, and the trigger only acts when `to_buy` wasn't sent;
- migration `0012` turns every `one_off` into `staple`, so older versions treat former
  one-offs as regular products too. Marks and `updated_at` are untouched. Demo data in the
  browser is converted the same way when read.

## Consequences

- The shape of home data didn't change, so `VERSION` in `snapshot.ts` stays the same.
- A former one-off goes on the list when it runs out, both in the new version and, after
  the migration, in older ones.
- An older version that hasn't been updated can still create a one-off. The new version
  ignores `kind` and treats it like any other product.
