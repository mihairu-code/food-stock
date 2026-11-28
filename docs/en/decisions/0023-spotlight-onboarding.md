# 0023. Onboarding — spotlight windows at the moment of action

**Status:** accepted · November 2026

## Context

Before v1.4 the app explained itself with paragraphs: "How to mark" on Home, "Smart list"
in Shopping and an account note in the settings. New users saw them for the first three
days — and read them before the home had a single item, when there was nothing to explain
them on yet. The main points — tapping an item means "it ran out", the plus puts on the
list something that's still at home, a swipe opens "Edit" and "Delete" — got lost in
the text.

Options:

1. **Slides at first launch.** People flip through without reading and have forgotten
   them by the time they matter.
2. **A step-by-step tour with highlights.** At first the home is empty, so there's
   nothing to highlight; a "Next" chain breaks on one stray tap; most people press
   "Skip" and then see nothing at all.
3. **A bubble next to the element at the moment of action.** It comes when it's needed
   but stays part of the layout: easy to miss, and it competes with neighbouring
   elements for room on a small screen.
4. **A window over the app at the moment of action.** Everything is dimmed, the element
   in question shows through a cutout (a "spotlight"), with a sentence or two next to it.

## Decision

The fourth option, without a chain.

- **Each window is its own moment.** The reason is the state of the home, not an event:
  sections but no items; an item with a plus; two, four, twenty items; rows in Shopping;
  the first purchase. So the same order works for someone invited into a full home and
  after "Show hints and tips again". Skipping one window doesn't mean skipping them all.
- **One at a time, never in a rush.** A window opens only on a calm screen: no sheet,
  search, dragging, keyboard, or toast with Undo (the window would cover its button). One
  caused by the person's action shows as soon as the screen settles; ones that piled up
  come at most once a minute.
- **Pressing the lit element.** Under a modal dialog the element can't be tapped, so the
  window catches a tap in the cutout and follows its rule: press the element (add an item,
  buy, open search), turn the step (the item, then the plus — pressing would turn the
  plus into a minus), or just close (gestures — swipe and drag — can't be passed on; the
  row's own motion shows them).
- **How it's built.** A native `<dialog>` with `showModal()`, like the sheets: top layer,
  focus inside, Escape. The dimming is the cutout's shadow `0 0 0 100vmax var(--scrim)`,
  with a `--spot-ring` around it — without it the cutout is barely visible in the dark
  theme. Where the bubble goes is worked out by a pure function, `placeCoach`: below,
  above, or as a card over the tab bar.
- **Ready-made sections** on an empty home are a screen, not a window: there's nothing
  to highlight there.
- **"First steps"** is a line in the window, "First steps · 2 of 5", not a separate card.
- **Tips** use the same window but are about habits rather than buttons: not before the
  third day, at most once a day, with their own switch in the settings.
- The "How to mark", "Smart list" and account paragraphs are gone.

## Consequences

- Everything shown is kept on the device (`home-stock:coach-seen`,
  `home-stock:first-steps`, `home-stock:tip-events`). There's no analytics: nobody but
  the person's phone knows what they went through and what they skipped.
- Current users don't see the hint windows: more than three days have passed for them,
  or hints are off. They do see tips.
- A new element that needs explaining gets a `data-coach` mark, and its window is
  described where its reason is known (`useHomeCoach`, `useShoppingCoach`,
  `useHomeTips`).
- Every new window is one more stop for the person. Windows are added only when things
  are unclear without them, not because the mechanism is already there.
