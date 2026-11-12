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

## Nov 9, Mon

Email goes out. I tried inviting someone into a home and it hurt: the email didn't
arrive (Supabase's built-in mail only sends to its own people), and when it did, you
still had to copy the code without mixing up apps. Overkill for a home list.

I weighed the alternatives in [0003](decisions/0003-anonymous-users.md). Settled on
Supabase anonymous users: `signInAnonymously()` gives a proper `auth.uid()`, and all my
RLS stays as it was — that's the key part. The second person is invited with a link.

A link is basically a key to the home, so:
- it works once and lives 7 days;
- the database only keeps sha256 of the token, the token itself can't be read back;
- the hash column isn't granted to the client at all (column-level `grant select (id, …)`).

The token goes into the hash `#join=…`, not the query — the hash never reaches the
hosting server and doesn't end up in logs.

A separate iPhone trap: Safari and the home screen app have different storage. A link
from a messenger opens in Safari, the person joins the home there, and in their
"installed" version they're a brand new empty user. Hence "Join by link" in settings —
you just paste the link there.

One more thing I almost forgot: a home is created automatically on first launch, so if
someone arrived straight from a link they'd keep an empty "Our home". `join_household`
now deletes the empty auto-created home after joining someone else's.

Deployed to Vercel. Right away: the bot that renders link previews in a messenger
honestly opens the site — and creates an anonymous user with a home. Every time.
I check `navigator.webdriver` and show such visitors the demo. Plus `noindex`, search
engines have nothing to do here.

## Nov 10, Tue

Morning — small things that annoyed me on the phone.

**Icons.** The form used to have a fixed set of emoji. Now they follow the name:
a dictionary of word stems ("молок", "сухар") so Russian cases and diminutives match,
plus groups — if there's no exact icon I show the neighbours: "сухарики" gives
🥨 🍟 🥜 🍿. One typo is forgiven (Levenshtein ≤ 1, only for stems of 4+ letters,
otherwise "кол" matches anything). The word list itself was drafted by an AI tool and
I went through it and cleaned it up — by hand it's an hour of dull work.

**Optimistic updates.** The lag after a tap was really annoying. Now `useHomeMutation`
patches the TanStack Query cache first, then sends the request; on error — rollback and
a toast. The important bit: all mutations of one home share one `scope`, so they run
strictly in order. Otherwise "added a product and immediately marked it out" could reach
the server the other way round. And I only refetch after the last mutation in the
queue, or the server's answer to the first one overwrites the optimistic state of the
second — you can see the row blink.

For that, new ids are generated on the client (`crypto.randomUUID()`), otherwise the row
"moves" when the real id arrives.

**memo.** Went through the profiler: marking one product re-rendered every row. Rows are
in `memo` now, actions are one object from `useMemo` — it's stable, and a row only
re-renders when its own product changes. Realtime events are batched (one change = a few
events in a row) — one refetch after 150 ms.

Toasts go through a context for now. Works, but calling a hook just to show a toast is
meh, I'll redo it later.

Then I sat down and wrote the update rules ([0004](decisions/0004-safe-updates.md)) —
after realising that in `0003` I happily dropped tables only because the database was
empty. Real people live there now. The main ones: migrations only add, and no
`React.lazy` — an old tab will ask for a chunk that's gone after a deploy.

## Nov 10, evening

Google account. Without it a person = a device, and that's already bitten me: install
the app to the home screen and you're a new user there, separate from the one in Safari.
One person — two home members, both called "Member".

At first I wanted it simple, `linkIdentity`: attach Google to the current anonymous user.
Works right up to the second device — the account is already taken there and linking
fails. So the other way round: sign in with Google normally and **merge** the device's
anonymous user into the account. Wrote it up in
[0005](decisions/0005-google-account-merge.md).

The interesting part is proving after the redirect that "this anonymous user" is me.
I made a ticket: before going to Google the device takes a one-time token, only its hash
is stored, the `private` schema isn't exposed. After coming back the account presents
it and `complete_merge` moves the homes. If both sides have homes with data — I ask
which to keep and say plainly what happens to the other. Nothing merges without a choice,
data stays safe.

The migration came out the fattest of them all — and it's the first one written under
the "only add" rule. There are more tests than code: steal someone else's ticket, use
your own twice, merge into a home other people live in (then you just leave it and the
oldest member becomes the owner).

For the member list I added a device label — "Safari · iPhone" — and the account email.
The label is written in Russian for now, because the app is in Russian for now.

A small thing that ate an hour: the invite link lives in the URL hash, and the hash is
lost after the trip to Google. I park the token in `localStorage` before the redirect.

No sign-out yet. I don't understand yet what should happen to the home on the device
after signing out — need to think.

## Nov 11, Wed

A couple of days of real use, and the thing I postponed on day one came back: "at home"
and "need to buy" are glued together. Milk is still there but will run out tomorrow —
can't put it on the list. Some junk we won't buy again ran out — it hangs on the list,
and the only way to remove it is to delete the product. I went through the options in
[0006](decisions/0006-independent-stock-and-to-buy.md) and picked a `to_buy` flag on the
product: the list stays computed, no duplicates.

The catch is the old version on people's phones. It only sends `is_available` and knows
nothing about `to_buy`. Left alone, "ran out" would stop adding things to the list for
it. I added a trigger: if stock changed and `to_buy` wasn't touched, `to_buy` follows
stock by the old rule. The new client sends both fields, and the trigger leaves it alone.
Plus an "upgrading an existing database" test: apply migrations up to `0005`, load data
"like production", apply the rest — everything that was on the list is still there.

UI: the in/out mark became a dot on the icon (the notebook checkbox from the mockup took
half the row and got confused with the plus), tapping the row itself toggles stock, and
"+ / −" sits on the right.

Tabs. A bottom bar on an iPhone with the gesture strip looked heavy. I made three
separate buttons floating over the content — borrowed from Pinterest. Translucent with
`backdrop-filter`; the strip between them lets taps through (`pointer-events: none` on
the container, `auto` on the buttons).

Then i18n. Russian would do for home, but I wanted to do it properly while there are
few strings — digging them out of the markup later would hurt more. No libraries:
a dictionary object, `useT()` on `useSyncExternalStore`, plural forms via
`Intl.PluralRules`, and a tiny function that turns `<b>…</b>` in a string into
`<strong>`. `ru.ts` is the reference, the others are typed as `Messages` from it, so
TypeScript won't let me forget a key. Plus a test that every dictionary has the same
keys, placeholders and `<b>`.

The English, Japanese and Vietnamese translations are an AI draft that I proofread.
English with confidence, Japanese and Vietnamese as far as my knowledge goes — fixes from
native speakers would help. All dictionaries ship in
the bundle, no lazy loading (see [0004](decisions/0004-safe-updates.md)).

Yesterday I stored device labels in Russian — a mistake. Now they go into the database
in English ("App · iPhone") and get translated on display, and the old Russian labels
are still understood.

Emoji suggestions learned the other languages, and that turned out to be the most fun
part: English needs plurals but must not match "eggplant" for "egg"; Japanese has no
spaces — I search substrings and fold katakana into hiragana; Vietnamese only matches
whole words ("sữa chua" is yogurt, not milk), and works without diacritics too, but then
doesn't fill the icon by itself.

In the evening — sign-out. I decided it only signs out this device (`scope: 'local'`),
and Google always asks for the account — on a shared tablet the wrong person would sign
in otherwise.

## Nov 12, Thu

I opened the code after a week of racing and saw the screens had become a dump: each
has its own `useState` for a sheet, its own mutations with optimistic patches, its own
`useToast`. `Sheet` is imported in three screens. Time to clean up.

First thought — bring in Redux Toolkit with RTK Query, a familiar tool.
I sat down and wrote out what actually lives in state
([0007](decisions/0007-tanstack-query-not-rtk.md)): the server cache — TanStack Query
already holds it, and does it well; plus two values — the open sheet and the current
toast. A second cache and slices for two values — meh. I wrote a `createStore` on
`useSyncExternalStore`, about 30 lines.

The order of the cleanup:

1. Mutations go to `data/hooks`: `useCreateProduct`, `useSetProductState` and so on.
   For one-off actions without optimism (invites, members, sign-out) — `useAction`,
   which says right there what toast to show and what to refetch. A toast is just
   `notify('key')`, no hook.
2. Sheets — one `SheetHost` in the Layout and `openSheet({ type: … })` from anywhere.
   Each sheet knows its own mutations. A screen knows nothing about sheets anymore.
3. One component per file. `SettingsScreen` was a wall of code — cut into groups. Shared
   bits (`TextField`, `SettingRow`, `SummaryBar`) moved to `components`.

After lunch — startup speed. On the phone "Loading…" hangs for a second and a half on
launch, although the data barely changes between launches. Three things:

- a snapshot of the last data in `localStorage` (per user; wiped on sign-out) — shown
  right away, fresh data comes in the background;
- the home data is requested together with the list of homes — I know from last time
  which home will open, no reason to wait;
- `preconnect` to Supabase while the script downloads, and libraries in separate
  chunks — after a deploy the phone only re-downloads the app code.

One more small thing: by default TanStack notifies components on a timer, and when the
phone is busy with a touch, an edit showed up on screen with a delay. I switched the
scheduler to a microtask — feels noticeably snappier.
