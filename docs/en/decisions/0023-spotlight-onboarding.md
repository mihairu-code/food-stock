# 0023. Onboarding — five spotlight windows in a row, everything else as tips

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
2. **A classic "Next → Next" tour.** At first the home is empty, so there's nothing to
   highlight; the chain breaks on a stray tap; most people press "Skip".
3. **A bubble next to the element at the moment of action.** Easy to miss, and it
   competes with its neighbours for room on a small screen.
4. **Separate windows over the app,** each on its own reason: two items, four, twenty.
   That was the first version of v1.4. In practice the onboarding fell apart: windows came
   days apart, the person might never try the main functions, and the "First steps"
   counter counted things done and hardly moved.
5. **A short pass in a row in spotlight windows,** where each step waits for its reason,
   and everything optional comes later as tips.

## Decision

The fifth option.

- **Onboarding is five steps in a row at the start.** Add an item; the item, the plus and
  the Shopping tab (one window, three cutouts); in Shopping, the tick and "+ Add"; the
  swipe on Home; "New section" and a section's pencil. The counter is the step number:
  "Getting started · 3 of 5".
- **How it differs from the tour in option 2.** A step opens only when its element is on
  screen: no highlighting of emptiness. Step 3 waits until something is on the shopping
  list and the person opens it — that is, until they've tried it themselves. There is no
  "Skip", and a stray tap outside the window does nothing, so one extra touch doesn't
  break anything. A window closes only by its own button (or Escape, counted as "Got it").
- **Everyone goes through it,** including long-time users: they already have items, so
  the tour starts at step 2. "Go through getting started again" is in the settings.
- **Pressing the lit element.** Under a modal dialog the element can't be tapped, so the
  window catches a tap in the cutout and follows the step's rule: press the element (add
  an item, open Shopping, search), turn the step (the item and the plus: pressing would
  turn the plus into a minus), or nothing. Gestures — swipe and drag — are shown by the
  row's own motion.
- **Feature tips** come after the tour, as soon as there's a reason, at most one window a
  minute: rearranging items (7 items) and sections (3 sections), search (20 items), and
  right after the tour, inviting the people you live with.
- **Habit tips** use the same window, from the third day, at most once a day.
- **How it's built.** A native `<dialog>` with `showModal()`, like the sheets: top layer,
  focus inside. The dimming is the cutout's shadow `0 0 0 100vmax var(--scrim)`, with a
  `--spot-ring` around it — without it the cutout is barely visible in the dark theme.
  Where the bubble goes is worked out by a pure function, `placeCoach`: below, above, or
  as a card over the tab bar. A window opens only on a calm screen: no sheet, search,
  dragging, keyboard, or toast with Undo.
- **Ready-made sections** on an empty home are a screen before the tour, not a window.
- The "How to mark", "Smart list" and account paragraphs are gone.

## Consequences

- The tour step and the tips shown are kept on the device (`home-stock:tour`,
  `home-stock:coach-seen`, `home-stock:tip-events`). There's no analytics.
- A new element that needs explaining gets a `data-coach` mark. If the app can't be
  understood without it, it's a tour step (`useHomeCoach`, `useShoppingCoach`);
  otherwise it's a tip (`useFeatureTips`, `useHomeTips`).
- Every new step makes the tour longer for everyone. Steps are added only when the basics
  are unclear without them.
