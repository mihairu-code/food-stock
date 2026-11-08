# Dev diary

Written for myself, as I go. What I did, what didn't work, why I went this way and not
that one.

---

## Nov 6, Fri

Starting. The idea has been around for a while: the eternal "do we have eggs?" call from
the store. We tried a shared note — a week later one person maintains it and nobody
else opens it. Tried a couple of shopping list apps — they're all about the list, not
about what's actually at home. And I need the second thing: open it, look at the
"Fridge" shelf, see what ran out.

Things to write down now, before I forget why:

- **Custom sections.** At first I wanted store-style categories, "Dairy / Veggies /
  Grains". But nobody thinks like that at home. People think "what's in the fridge",
  "what's in the cupboard over the stove", "the snacks we hide from ourselves". Let
  users make their own.
- **Two marks, not one.** "At home" and "need to buy" are different. There's still
  milk, but it'll be gone tomorrow — I want to add it to shopping without pretending
  it's out. So for a staple "out" puts it on the list automatically, but you should be
  able to add something that's still there too. That part won't fully make it into the
  MVP — I'll do the automatic half first and see.
- **Staple vs one-off.** A staple is what should always be there (milk, bread, coffee).
  A one-off was bought once (a cake, some spice for one recipe). When a one-off is
  gone we just remove it, it doesn't go to shopping.

Drew the screens on paper, then ran them through an AI tool to get proper mockups in
one style. The style is "paper": warm background, thin lines, serif headings. I don't
want yet another material design.

Picked the stack in half an hour, wrote it down in
[0001](decisions/0001-pwa-not-native.md) and [0002](decisions/0002-supabase-backend.md).
Short version: a PWA, because I'm a frontend dev and I don't need app stores; Supabase,
because my own Go backend is another week or two before the first screen. A pity about
Go, I wanted the practice. Later.

Plan: everything on local storage first, screens and logic. Supabase after that.

## Nov 6, evening

Skeleton. Vite + React + TS; the scaffold was generated with an AI assistant so I didn't
have to fiddle with configs by hand, then I went through it and threw out the extras.
The `@/` alias right away — rewriting imports later is no fun.

I started not with screens but with the `Backend` storage interface and its local
version on `localStorage`. The "what's on the list" logic is pure functions in
`domain/logic.ts`. I **don't store** the shopping list: it's just staples that ran out
plus manual items. At first I wanted a separate shopping table pointing at products, but
then I'd have to make sure a row never doubles and disappears when the product is
deleted. Computing it is simpler, and there's physically nothing to duplicate.

Tests go straight against the acceptance criteria from the brief, point by point.

## Nov 7, Sat

Screens all day.

- TanStack Query for data. Mutations are as dumb as possible for now: send → refetch
  everything. You can see the lag after a tap, especially on "In/Out". I'll make it
  optimistic later; right now it just has to work.
- Sheets are a native `<dialog>` with `showModal()`. Focus trap and Esc for free, no
  library needed. Each screen keeps a `useState` with the open sheet. I can feel this
  growing out of hand, but it's fine for now.
- A section is a collapsible card; the state is remembered in `localStorage`.
- The stock mark is a "notebook" checkbox: tick / dash, like in the mockup.
- One-offs: in the database they can only exist as "in stock" (that's how I made the
  schema), so "out" means delete. Feels a bit odd, we'll see.
- Wrote swipe-to-delete myself on pointer events — nothing fancy: a threshold, and the
  axis tells scroll from swipe. Plus an × button for keyboard users that only shows on
  hover and focus.
- Dark theme — variables on `:root[data-theme='dark']`, picked in settings.
- PWA plugin, icons, manifest. Checked that the service worker only caches the shell —
  database responses never hit the cache, otherwise after switching users you could see
  someone else's data.

## Nov 8, Sun

Supabase. The schema is in `0001_init.sql`: home → members, sections, products, manual
shopping items. Everything hangs off `household_id`, RLS on every table: I only see
homes I'm a member of. The "am I a member" check is a `security definer` function in
a separate `private` schema, otherwise the policy on `household_members` references
itself and recurses.

Buying a manual item is the `purchase_shopping_item` RPC: delete it from shopping and
create the product in one transaction. If the section belongs to another home,
a composite foreign key blocks it and everything rolls back.

I really wanted to test RLS for real, but didn't want Docker just for that. Found
PGlite — Postgres in WASM, runs right inside vitest. Stubbed the Supabase environment
(`auth` schema, `anon`/`authenticated` roles, `auth.uid()` from a setting) and run the
migrations as different users. Love it, takes a second.

When I applied the schema to the live project, something came up: by default Supabase
gives `authenticated` **all** privileges on new tables, so my narrow `grant`s didn't
narrow anything — only RLS was holding. Added `0002`: revoke everything and grant back
only what's needed.

Sign-in is a code from an email. Separate surprise: the default email templates send
a link, not a code, so I had to dig into settings and add `{{ .Token }}`. And the
built-in mail only delivers to members of the organisation. So getting a second person into
the home is already a quest.

One more bug: a signed-out user got an endless "Loading…". `currentUser()` returns
`null`, and I was treating "no data" as "still loading". Didn't show up in demo mode,
there's always a user there.

v0.1 is done. It works, but email sign-in hurts. Looks like that's the next thing to fix.
