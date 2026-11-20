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

## Nov 12, evening

Finally the thing I've been missing myself since day one: my own order. I want milk at
the top and spices at the bottom, not "in the order I added them".

Native drag and drop was out right away — on iPhone with a finger it basically doesn't
work. `@hello-pangea/dnd` is fine for a simple list, but here it's
lists inside a list, and it's heavier. Went with dnd-kit
([0008](decisions/0008-drag-and-drop-dnd-kit.md)): sensors for mouse, touch and
keyboard, screen reader announcements out of the box.

The main catch is one finger for three gestures: scrolling, the delete swipe and
dragging. Split it like this: on touch dragging starts only after a 250 ms hold, with a
mouse right away, but only vertically — horizontal stays with the swipe.

The order is stored in the database (`0006`): an empty `sort_order` means "never
reordered", those go after the rest by time. The older version on the phone doesn't
know about the order and breaks nothing. And an important one: reordering doesn't touch
`updated_at`, otherwise the shopping list gets shuffled.

Moving to another section turned out to be the same call as reordering: the product
just shows up in the other section's list. I had to write my own collision detection for
the board — the stock ones got confused when you drag a row over a collapsed section's
header.

## Nov 13, Fri

In the morning I merged the drag branch and right away did the same for shopping — in
the store it's handy to lay the list out in the order you walk (`0007`). Vibration on
pick-up and drop is Android only: Safari on iPhone has no `navigator.vibrate`, and
there's no way around it.

Then I finally got to the looks. Dotted background and translucent buttons, member
initials in the header. Turned off page zoom: on the phone a double tap on the "+"
button sometimes zoomed the screen, drove me nuts.

Next — the keyboard on iPhone, which ate the whole second half of the day. The keyboard
doesn't shrink the page, it lies on top of it, and a sheet with an input ends up under
it. `lib/keyboard.ts` listens to `visualViewport` and writes into CSS variables how much
is covered — the sheet uses them to sit higher. In Safari it's fine now, in the app
from the Home Screen it still drifts sometimes. Noted it, will come back.

Along the way a sheet can be swiped down, and the page under it no longer scrolls.

In the evening I wanted a parallax: the dots move slower than the content. On desktop —
pretty, on iPhone — it twitches: the `scroll` event and the actual scrolling aren't in
step, the dots lag and jump. Spent half an hour trying to tune it and reverted. The
background just stays put now, the content slides over it — nothing left to twitch.

Last thing for the day: after a drop the row jumped back to its old place for a frame. I
was clearing the draft order on drop, while the cache still held the old one until the
optimistic update landed. Now the draft lives until fresh data arrives. And while a drag
is active the delete swipe steps aside — via a module-level flag, so rows don't
re-render just for that.

## Nov 14, Sat

In the morning I closed v0.6 and got to something I'd wanted for a while: making the
app feel like your own.

Accent color. Six of them, each with two sets of values — for light and dark, all
through `data-accent` on `<html>` and variables. Tuned contrast by hand: rose on the
dark background looked like an error at first, had to lighten it. `lib/theme.ts` became
`lib/appearance.ts` with a small store. And I finally got rid of the flash: launching in
the dark theme, the screen was light for a frame until the script loaded. Now a tiny
inline script in `index.html` sets the theme before the first paint. The
`localStorage` keys are the same as in `appearance.ts` — noted that in both places.

The home avatar is an emoji, like sections have, and it replaces the initials in the
header. Member photos from Google — here I thought a bit about security: other
members' browsers will load the image URL, and a person can edit their account
metadata themselves. So `sync_profile` (`0008`) accepts only
`https://…googleusercontent.com/`, anything else becomes `null`. I didn't touch the
function's signature, the photo comes from the token: the old version on the phone will
send it too. Plus `referrerPolicy="no-referrer"` on the `<img>`, otherwise Google
sometimes answers 403.

Sections moved to their own settings screen, not just the pencil on the board.

After lunch — the native `<select>` in a sheet. On iPhone it's the same thing every
time: the keyboard hides, a wheel at the bottom, the sheet jumps twice. Made a row of
tiles that scrolls sideways, tapping doesn't take focus from the field
([0009](decisions/0009-section-tiles-not-select.md)). Along the way the purchase sheet
got "Don't add home" — some one-off purchases aren't worth tracking at home.

In the evening — the emoji panel. A web app can't open the system emoji keyboard, and
pasting emoji into a text field is clumsy. Made a "＋" button in front of the
suggestions and a panel with ~160 icons. The panel takes the keyboard's place: both
don't fit in the sheet, so opening the panel blurs the field, and going back to the
field closes the panel.

Then the stuff that had piled up: hints for newcomers for the first three days,
`FormSheet` — one frame for all forms (there were seven of them by now, each living its
own life), a lighter delete swipe. I rewrote the swipe so the row moves via `style`
directly, without a React re-render on every move — so it doesn't lag behind the finger. Added a flick: a quick move deletes from a short distance.

Late evening — the keyboard again. Above it there's room for half a sheet, and in the
product form the buttons ended up under the keyboard. While the keyboard is open I set
`data-keyboard` and tighten the form. Plus two accidental closes: a tap on a field
during which the sheet moved "ended" on the backdrop and closed the sheet; and the
checkbox took focus and hid the keyboard.

## Nov 15, Sun

In the morning I tried to finally fix the Home Screen app, where the sheet sometimes
sinks under the keyboard: remember the keyboard height when it can be measured honestly,
and lift the sheet at least that much. Deployed, opened on the phone — the sheet flew
off past the top edge. Great.

Enough guessing. I made a temporary panel that prints the numbers from `keyboard.ts`
right on top of the app, recorded the screen and went through it frame by frame. Here's
the picture: when opening the keyboard, iPhone also shifts the screen itself up to show
the field. The small bottom inset was true — the screen was already shifted, and the
remembered height lifted the sheet hundreds of pixels too high. And sometimes the
screen shifts once more after the last event, and the sheet stays where the event left
it.

Reverted the attempt and rewrote it: the position is a pure function of what the phone
reports right now, the screen height comes from an invisible full-screen probe, and
while the person types the numbers are re-measured on a timer
([0010](decisions/0010-sheet-from-current-viewport.md)). The numbers from the recording
went into the tests. Removed the numbers panel from the code.

A small thing to finish: pressing a toggle in settings dimmed the whole row — `:active`
bubbles up from the nested control. Now only rows that are pressable as a whole get
dimmed.

## Nov 15, afternoon

"How do I put it on my phone?" is the first question when you open the link. I got
tired of explaining it in words every time, so I made it part of the welcome screen.

First — figure out the device. A pure function of the `userAgent` and two flags
(already open as an app, and is there a touch screen), so it can be covered with tests
on real browser strings. The funniest one is iPad: Safari there introduces itself as a
Mac by default, only `maxTouchPoints` tells them apart. Chrome and Firefox on iPhone
can't install by themselves — they have "Share" in their own toolbar, different steps.
Chrome, Edge, Yandex and Opera on desktop are all Chromium and all call themselves
Chrome, one path for all of them. Firefox on desktop can't install sites — I say so.

The first version was text: "tap Share". I reread it as someone who doesn't use an
iPhone every day — it's unclear which of the icons is "Share". So I drew a scheme of the
window for every step: a few `div`s, lucide icons and an outlined button. Screenshots
were out right away — they go stale with every iOS update, they're heavy and they don't
recolor for the dark theme. The schemes recolor for free, through the same variables.

Chrome and Edge can install by themselves via `beforeinstallprompt`, but the event
arrives right after load, before the welcome screen even shows. I catch it at startup
into a small store and hold on to it — the card shows a real "Install" button and
tucks the steps under "How to install manually".

Along the way, a global rule for "Reduce motion" — there's a lot of animation now.

## Nov 15, evening

While it's fresh, I wrote down the iPhone notes — everything the last few days went
into: the keyboard, the screen shift, focus, what a web app just doesn't get. In a month
I won't remember why the sheet is computed exactly this way and not simpler. Plus
`CONTRIBUTING` with the code rules and what must not break while the old version lives
on phones.

## Nov 15, night

Before bed — security. RLS on every table and hashed invite tokens were there from the
start, but there were no headers on Vercel at all. Added a CSP: scripts only our own,
data only to Supabase, images also from googleusercontent (member photos), no framing.
The inline theme script is allowed by its hash — plus a test that computes the hash
from `index.html` and checks it against `vercel.json`. Otherwise I'll change the script,
forget the hash, and after a deploy the theme flashes again and I won't even know why.

Along the way I found a nasty bug on desktop: clicking the "Always keep at home"
checkbox square toggled the state, but the browser put the old look back. The product
got saved as a staple with an empty box. Gave the toggling back to the browser; the label
only guards focus now.

## Nov 16, Mon

Moving day. A hundred-plus files in folders by type: `components`, `screens`, `sheets`,
`data/hooks`, `lib`. The "keep at home" checkbox knows about products but sits next to a
settings row button; `lib` has started pulling data. Nothing limits who imports whom.

Went with Feature-Sliced Design ([0011](decisions/0011-feature-sliced-design.md)): the
rules are well known, clear, and can be checked by a test. Moved in three
steps so everything builds after each: first `shared` and `entities` — only file moves
and import paths, then `features`, `widgets` and `pages`, and only then `app`, an
`index.ts` per slice and everything I wanted to rename.

In that last step I went through every file: split `domain/logic.ts` by owner, merged
similar things (`Tip` → `Hint` with a flag, `Splash` → `StatusNote`, three confirmation
sheets → one, Home and Shopping rows → a shared `ListRow`), renamed `submit` to
`saveProduct` and so on. And the `fsdBoundaries` test: it walks `src` and fails on an
import that goes up, into a sibling slice or around `index.ts`.

In the evening — styles. Cut the 1900-line `index.css` by layer
([0012](decisions/0012-css-by-layer-rem.md)), moved sizes to `rem` on scales. To not
break the look I dumped `getComputedStyle` of every element before and after and
compared them with a script — the difference is only 1–2 px rounding. Along the way the
"out" dot became solid red instead of a ring: a ring on a small icon read poorly.

## Nov 17, Tue

Editing, finally. A typo in a name meant "delete and add again", losing the place in the
shopping list along the way. Editing is the same sheet as adding, just with the fields
filled in. A database nuance: a trigger moved the product's `updated_at` on any edit,
and the shopping list is ordered by `updated_at` — a renamed product flew to the end.
Narrowed the trigger (`0009`): only the "at home" and "to buy" flags now.

How do you get to editing on a phone? First I wanted a tap on the row, but a tap on the
icon already toggles stock. Did it like Mail: a swipe left opens Edit and Delete, only
one row can be open. On desktop — a pencil and a cross on hover.

Right there, protection from duplicates: two "Milk"s in one home is confusing. The field
turns red, shakes and says which section already has it.

After lunch — what annoyed me on the phone: switching tabs flickered, and Home jumped to
the top every time. Several causes: the screen was recreated, an opacity animation
played, Home with dnd-kit doesn't build instantly. Went through the options
([0013](decisions/0013-realtime-into-cache-kept-tabs.md)), View Transitions in Safari are
uneven with a fixed header. Kept Home and Shopping mounted, hide the inactive one with
`hidden`, remember the scroll at the moment of navigation. Without the animation it
actually feels nicer.

And realtime: every change by someone else refetched the whole home with five requests.
Now the row from the event goes straight into the cache. The trickiest part is the echo
of my own edits: the event about my edit can arrive after the next one and bring back
the old state. Such events within a two-second window aren't applied — just one table is
refetched.

## Nov 17, evening

After the release I sat down at a computer to check the hover buttons and found a nasty
one: the cross appeared to the right of "+" — exactly where it had been. You move the
mouse down the column of pluses, click — and the product is gone. Moved the pencil and
the cross to the left of the main button, removed the labels under the swipe buttons,
and "Bought" became a check button.

And since deleting by accident got easier, deleting has to be reversible
([0014](decisions/0014-delete-with-undo.md)). I didn't want a confirmation for every
delete — you get used to it fast and tap "Yes" without looking. A server-side trash is a
new column, a filter in every query, cleanup. Went simpler: the record disappears from
the screen right away, and the request goes out when the toast with "Undo" closes. Until
then the server has nothing to restore. The subtle part is when to send: on the next edit
(it was computed against a screen without the deleted record) and when the app goes to
the background, otherwise the phone unloads it together with the unsent delete.

With undo in place, the long swipe became safe: past the middle the delete button grows
to the whole strip, let go — deleted. Tuned the threshold on a narrow screen so that
"just open the buttons" doesn't turn into a delete: no closer than 48 px beyond them.
Rounded the buttons, and the lines between products looked rough next to them — removed.

## Nov 18, Wed

Morning — sheets. You couldn't pull a sheet down by its field: any touch on a field went
to the browser. Now a clear move down goes to the sheet, sideways and holding stay with
the field. Focus too: on open the sheet put a focus ring on the first section tile, and it
just hung there. Now the sheet focuses itself unless something asks explicitly with
`data-autofocus`.

Then the keyboard in the Home Screen app again: sometimes the sheet still went under it.
Pulled out a temporary panel with the numbers (enabled by a build variable — a URL
parameter won't do, the Home Screen app has its own storage), deployed a test build in
demo mode and recorded the screen. On the recording: visible 458, shift 274, a full-screen
probe 873 tall with its bottom at 599. So in the app iPhone reports the coordinates of
fixed elements already minus the shift, and I subtracted it a second time. The screen
height is the probe's height, not its bottom. Plus a fallback self-check: once the sheet
settles, compare its bottom with the visible bottom and add the miss to the lift. The
numbers from the recording went into tests, the panel went away.

After lunch — cleanup in the database ([0015](decisions/0015-forget-inactive-anonymous.md)).
An anonymous user lives on one device: delete the app — and their home sits in the
database forever. First the visit mark: once a day per device, on launch and when coming
back to the app. An important point — users from before the migration can't get "today":
an anonymous user who hadn't visited for 300 days would get an extra year. I take an
estimate from sessions and tokens. Then the cleanup itself via `pg_cron`: anonymous users
who haven't visited for over a year; from a shared home only they leave, and the oldest
member becomes the owner. Google accounts are left alone.

In the evening — "Undo" for buying a home product too: in a store it's easy to tap the
wrong row.

## Nov 19, Thu

I wanted the icon to be selectable — a dark one looks better on a dark wallpaper.
Generated the icon set and the PNG build script with an AI assistant from a reference,
then went through it and fixed things by hand — drawing seven icons in three sizes
manually wasn't worth it.

The unpleasant part showed up fast: a web app can't change its Home Screen icon by
itself. iPhone takes it only at "Add to Home Screen" from Safari, Android at install or
when it re-checks the manifest. Wrote exactly that under the choice, and put a "Copy app
link" button next to it to paste into Safari. Link copying already existed in the invite
sheet — moved it into a shared `copyLink`.

Technically: a separate manifest per icon with the same `id` — for the phone it's one app.
The manifests are built by a small Vite plugin from the same list of icons. The default
icon stays in the root of `public/` under its old names: installed apps point there.

## Nov 19, afternoon

Went over the markup ([0016](decisions/0016-semantic-markup.md)). It grew out of a
prototype where everything is a `div`, and in places it was plainly wrong: `div`s inside
`button` and `label`. Picked tags by meaning — `hgroup`, `section`, `aside`, `p` — styles
stayed on classes, and after the swap I compared positions and computed styles of every
element: not a single shift. The "name + caption" row text was laid out eight times — now
it's one `RowText`.

Then I hunted for repetition: the pre-login screen was drawn three times, the drag draft
lived as a copy in two hooks, the "name + icon + error" state in two forms. Extracted
`AuthScreen`, `useDragDraft`, `useNameWithIcon`. And wrote the code style down in
`CONTRIBUTING`: there's no formatter, everything rests on conventions, and they're better
seen.

In the evening — something about shopping that had bothered me for a while
([0017](decisions/0017-one-name-one-thing.md)). You could add a manual "Milk" while a
"Milk" product was at home: two rows about one thing, and buying the manual one created a
second milk at home. Decided the home product wins: wherever a name appears, both sides
are checked, and twins from older versions are merged on purchase — under one "Undo".

## Nov 20, Fri

Morning — drag and drop. The browser repainted the half-transparent "ghost" in the row's
place on every shift of the list; on a phone it was noticeable. Made the place empty: the
content is hidden, the row itself stays — it holds focus during keyboard reordering. Rows
make way a bit slower, 180 ms instead of 120: before, they jumped rather than slid.

And that's it: README with screenshots, release notes. Two weeks ago this was a prototype
from sketches, now it's an app that sits on the Home Screen and works with a shared database.
