# 0018. A third dot colour and a "not by colour alone" mode

**Status:** accepted · November 2026

## Context

A product has two independent marks: "at home" and "to buy"
([decision 0006](0006-independent-stock-and-to-buy.md)). The dot on the icon showed only
the first one: at home — green (no dot in the light theme), ran out — red. A product that
was still at home but already on the shopping list looked like any other product in stock.
In the shop, though, it matters to tell "must buy" (ran out) from "if you like" (still
some left).

Second: red, orange and green are exactly the colours people with colour vision
deficiencies find hardest to tell apart. The system doesn't tell the web about such
deficiencies, so there is no guessing.

## Options

- **A third state on tapping the icon** (in → low → out). The tap stops being a simple
  switch, and "low" doesn't mean "buy".
- **Long press** for "running low". Nobody would find the gesture, and on iPhone it
  clashes with drag and drop.
- **A separate flag in the database.** A migration and one more mark to keep consistent
  with the other two.
- **A separate palette per deficiency type.** People would need to know their diagnosis,
  and we would maintain four colour sets.
- **Derive the third state from the two marks, and add shape for telling them apart.**

## Decision

The dot state is derived from the two existing fields — `stockState(product)` in
`entities/product/model/stockRules.ts`:

| State | Condition | Dot | Caption on Home |
|---|---|---|---|
| `in` | at home, not to buy | light theme — none, dark — green | "Always at home" / "One-off" |
| `low` | at home and to buy | orange | "Still home · on the list" |
| `out` | ran out | red, grey icon | "Ran out" / "Ran out · on the shopping list" |

The internal name `low` stays in code; the interface never says "low": plus is pressed
for a reserve, for a sale and for a particular dish too. A list row gets the state as a
`data-stock` attribute; the shopping list does the same, manual items have no attribute
and no dot.

The "Not by colour alone" setting (Settings → App, off by default) puts `data-color-safe`
on `<html>`. In this mode the dot is larger, "still home, on the list" is a half-filled
circle with a ring, "ran out" is a solid circle with a bar, like a "no" sign; the colours
are a pair from the Okabe–Ito palette (sky blue and vermillion) that stays distinct with
any deficiency. Shapes are CSS only. The `home-stock:color-safe` key is also read by the
script in `index.html`, so the dots don't redraw on start.

Screen readers learn the state from the caption and the row's main button `aria-label`,
not from colour.

## Consequences

- Data, stock rules and the `products_sync_to_buy` trigger are unchanged; no migration.
- A new dot state means a new `stockState` value and a rule in `productStockIcon.css` for
  both modes.
- Dot colours are their own tokens (`--stock-in`, `--stock-low`, `--stock-out` and
  `*-safe`); the mode doesn't touch accents, delete or error colours.
- Changed the script in `index.html` — change its hash in `vercel.json` (a test checks it).
