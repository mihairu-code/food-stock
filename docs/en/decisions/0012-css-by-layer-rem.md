# 0012. Styles next to their layers, a rem scale

**Status:** accepted · November 2026

## Context

After the move to FSD the code is split by layer, but the styles aren't: one
`index.css` of 1900 lines. To fix a list row you search for it among install and
settings styles. Sizes are in pixels, and paddings that mean the same thing drifted
apart: 6, 7, 9 px side by side.

## Options

- **CSS Modules.** Class isolation, but the app's classes are unique anyway, and the
  switch would touch every component and mix this step with a markup rewrite.
- **Tailwind.** Fast to write, but the markup would have to be rewritten entirely, and
  the classes in it would get longer than the markup itself.
- **Plain CSS split by layer**, plus tokens. Minimal changes to the code, clear where
  things live.

## Decision

- Styles live in a file next to their layer: `shared/ui/styles/*.css`,
  `entities/*/ui/*.css`, `widgets/*/ui/*.css`, `pages/*/ui/*.css`, the layout in
  `app/layout`.
- `app/styles/index.css` imports them in layer order: with equal specificity, the rule
  from the higher layer wins.
- `tokens.css` holds the scales: spacing `--space-*` (2 px steps up to 16, then 4), text
  `--text-*`, radii `--radius-*`, `--tap-size`. Sizes are in `rem`, pixels only for
  borders, shadows and outlines.
- An input is at least 16 px — otherwise iOS zooms the page on focus.

I compared the computed styles of all elements before and after (`getComputedStyle`):
the difference is 1–2 px rounding where a value snapped to the scale. Two visual tweaks
along the way: the "out of stock" dot is a solid saturated red, buttons 48 → 44 px.

## Consequences

- A new component with its own styles means a new file and a line in
  `app/styles/index.css`.
- Sizes come from the scales, so inconsistent spacing stops piling up.
