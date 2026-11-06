# Home Stock — product brief

## Why

Same story at home every week: someone goes to the store, calls "do we still have
milk?", nobody remembers. Notes-app lists don't work — one person keeps them, everyone
else forgets to look. I want something simple: open the phone, see what's at home, and
have a shared shopping list that fills itself when something runs out.

Not a calorie tracker, not inventory management. No grams, expiry dates or receipts.
Just "in stock / out" and "need to buy".

## Who it's for

- A family or flatmates: 2–4 people sharing one home.
- Mostly phones. Installed to the home screen like an app.
- Usable with one hand, standing at a shelf or in a store aisle.

## Key decisions

1. **Users create their own sections** — "Fridge", "Pantry", "Snacks". No built-in
   categories: every home is organised differently.
2. **Two kinds of products.** A *staple* is something you always want at home.
   A *one-off* was bought once; we just note that it's there.
3. **Stock and shopping are separate things.** "At home" and "need to buy" are not the
   same: you can restock something you still have.
4. **A staple that runs out goes to shopping by itself.** Once bought, it's back in its
   section.
5. **A manual shopping item** ("batteries", "birthday cake") asks which section to put
   it in when bought, and can become a staple right away.
6. **Swipe to delete** — no trash, no archive.
7. **Sections can be renamed and deleted.** A non-empty one only after a confirmation,
   together with its products.
8. **A shared home.** Several people edit the same data, everyone sees the changes.
9. **Light and dark theme** in a "paper" look.
10. **Not a native app** but a PWA — one codebase for iPhone, Android and desktop.

## Screens

Bottom bar: **Home**, **Shopping**, **Settings**.

- **Home** — collapsible sections with products and their stock mark. Adding a product:
  name, section, staple or one-off, optional emoji.
- **Shopping** — one list: staples that ran out plus manual items. A product from home
  shows where it lives and whether it's in stock right now.
- **Settings** — members, invite, sections, theme, sign out.

## Key flows

**A staple runs out and gets bought.** Mark "Out" → the product stays in its section and
shows up in shopping → tap "Bought" in the store → it's in stock again and leaves the
list.

**A manual item gets bought.** Add to shopping without a section → "Bought" → pick
a section → without the checkbox it lands there as a one-off, with "Make it a staple" —
as a staple.

**Deleting a section.** A warning that its products go too → confirm → everything is
deleted in one go. Cancel and nothing changes.

## MVP

In:

- sections: create, rename, delete with confirmation;
- products: staples and one-offs, emoji, stock mark, swipe to delete (plus a button for
  keyboard and screen reader users);
- shopping: staples that ran out + manual items, "Bought" with a section picker;
- shared home: sign in, invite a member, sync between devices;
- light and dark theme;
- PWA: manifest, icons, cached app shell.

Out: quantities and units, barcodes, expiry dates, recipes, notifications, receipt
scanning, offline editing, complex roles.

### Acceptance criteria

- A section can be created, renamed and deleted; deleting a non-empty one needs
  a confirmation.
- Staples and one-offs can be added to a chosen section.
- A staple going "In → Out" appears in shopping exactly once, and after "Bought" it's in
  stock again and leaves the list, without a section picker.
- A manual item asks for a section on "Bought"; without the checkbox the product is
  a one-off, with it — a staple.
- Swiping a product away removes it from shopping too.
- Two members of one home see each other's changes.
- A member of one home can't read or change another home's data through the API.
- Both themes apply to every screen and stay readable.
- The app opens from the iPhone home screen.

## Open questions

- How to invite: by email or something simpler? Email invites for a start.
- Several homes per person? One for now, but everything in the database hangs off
  `household_id`, so it won't need a rewrite later.
- Same name twice in a section — allow it? Yes for now, let's see how it goes.
