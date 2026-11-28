# Changelog

## 1.4.1 — unreleased

- Hint windows bring their element to the middle of the screen at once, on open and on
  every "Next" (the smooth scroll didn't finish on iPhones and left the window off screen).
- Tour windows point at the first item of the first expanded section, not the newest one;
  collapsed sections are a shared store.
- A finished tour stays finished even if a later version has fewer steps.

## 1.4.0 — unreleased

- Getting started: five spotlight windows in a row (`CoachHost`, `CoachWindow` on
  `<dialog>`, `placeCoach`, `tour.ts`) — add an item; the item, the plus and the Shopping
  tab; the tick and "+ Add" in Shopping; the swipe; "New section" and the section pencil.
  The counter is the step; windows close only by their button; everyone goes through it,
  "Go through getting started again" restarts it — decision 0023.
- Ready-made sections on an empty home with multi-select and "Your own section"
  (`SectionSheet` pick mode).
- Feature tips after the tour (rearranging items and sections, search, invite), at most
  one a minute; habit tips 1–8 from the third day, at most once a day.
- Settings: "Getting started and tips" with the tips switch; the hints switch and the
  "How to mark", "Smart list" and account paragraphs are removed; the first plus gets a
  longer toast about the orange dot, once.

## 1.3.2 — unreleased

- Splash in `index.html`: the theme background and a loading picture show before the
  app's script arrives; the first full-screen loading note continues it without a pause.
- The loading picture is random each time (fridge, shelves, list), never twice in a row.

## 1.3.1 — unreleased

- "Leave home" in the settings (`public.leave_household`, migration `0013`, decision 0022);
  the longest-standing member becomes the owner; a lone member can't leave.
- A removed member is told "You were removed from “…”" instead of silently getting a new
  empty home.
- iPhone / iPad in a browser without an account: the settings suggest signing in with
  Google before adding the app to the Home Screen.
- No two sections with the same name; names compare `ё` as `е`.
- Loading pictures in `StatusNote` (fridge, shelves, list), shown after 300 ms.
- `localStorage` access wrapped in `try`; collapsed sections forget deleted ones.

## 1.3.0 — unreleased

- No more staple / one-off products: anything that runs out goes on the shopping list
  by itself; the "keep at home" checkboxes, `StapleCheckbox` and the staple / one-off
  row captions are gone. `kind` stays in the database for older versions; new products
  are written as `staple`, migration `0012` turns every `one_off` into `staple`.
- Stock dot position setting: icon right, icon left or after the name (`data-dot-place`).
- Row captions: "At home" / "On the list · still home"; minimal view setting (no captions,
  52px rows, `data-minimal`).
- Demo set: three sections of 8 products with all four states.
- The app icon is chosen in the install card on the welcome screen; settings show the
  picker only in a browser; "Copy app link" removed; `features/choose-app-icon`,
  `isStandalone()`.

## 1.2.0 — unreleased

- Home search: a round search button right of the tab bar (Home, 20+ products) stretches
  into a field above the keyboard; `ё` = `е`, Latin diacritics ignored, highlighted
  matches, "Add «…»" when nothing is found; `features/home-search`.
- Tab buttons sized from the app column (44px to 3.625rem), so the row fits at any width
  and browser font; `data-keyboard-anchor` in `keyboard.ts`.

## 1.1.0 — unreleased

- Orange stock dot for products still at home but on the shopping list ("Still home · on
  the list"), on Home and in the shopping list; `stockState`, `data-stock`.
- "Not by colour alone" setting: dot shapes and an Okabe–Ito palette, applied before the
  first paint (`home-stock:color-safe`).

## 1.0.0 — 2026-11-20

- One name, one thing: home products win over manual items with the same name; buying
  merges twins under one undo.
- Empty placeholder while dragging, smoother sorting and drop.
- Semantic markup and shared `RowText`; `AuthScreen`, `useDragDraft`, `useNameWithIcon`.
- Code style conventions in CONTRIBUTING; `--white` token.
- README with screenshots.

## 0.11.0 — 2026-11-19

- Choose the app icon in settings (seven icons, a manifest per icon).
- "Copy app link" next to it; shared `copyLink` for invites and the app link.

## 0.10.0 — 2026-11-18

- Delete with undo: delayed request, "Undo" in the toast; also for removing from the list
  and for buying a home product.
- Long swipe deletes; growing delete button, bounce, rounded swipe buttons, no dividers.
- Desktop hover actions moved left of the main button; icon-only buttons.
- Pull a sheet down from a text field; sheet focus rules; section tiles don't shift.
- Sheet above the keyboard fixed for the Home Screen app (viewport offset subtracted once).
- Last visit tracking (migration `0010`) and daily cleanup of inactive anonymous users
  (migration `0011`, `pg_cron`).

## 0.9.0 — 2026-11-17

- Edit products and manual items (migration `0009`: renaming keeps the place in the list).
- Swipe opens Edit and Delete; one open row at a time; pencil and cross on desktop hover.
- Duplicate name warning with a shaking field.
- Feature-Sliced Design structure with a boundaries test.
- Styles split by layer, rem scale and design tokens.
- Realtime rows patched into the cache; Home and Shopping stay mounted, each keeps its scroll.
- Security headers and CSP on Vercel; desktop checkbox fix.

## 0.8.0 — 2026-11-15

- Install guide on the welcome screen: steps for iPhone/iPad, Android, Chrome/Edge on
  desktop and Safari on Mac, each with a drawn scheme of the system UI.
- Native install button where the browser supports `beforeinstallprompt`.
- Global `prefers-reduced-motion` rule.
- Docs: iPhone notes, CONTRIBUTING.

## 0.7.0 — 2026-11-15

- Accent colors; theme and accent applied before the first paint.
- Home name and emoji avatar (migration `0008`), member photos from Google.
- Sections screen in settings; home switcher for several homes.
- Section tiles instead of the native select; "Don't add home" for manual purchases.
- Emoji panel instead of the system emoji keyboard.
- First-days hints with a settings toggle.
- `FormSheet` / `NameIconFields` for every form; lighter swipe with flick and collapse.
- Press feedback on iPhone; wide rows dim only when pressable as a whole.
- Sheet above the keyboard computed only from the current visual viewport; compact
  form while the keyboard is open; safer backdrop taps.

## 0.6.0 — 2026-11-13

- Drag and drop on dnd-kit: products within and between sections, sections, the shopping
  list (migrations `0006`, `0007`). Keyboard and screen reader support.
- Haptics on Android while dragging.
- Dotted background, glass buttons, home name and member initials in the header, no pinch zoom.
- Sheet stays above the iOS keyboard; scroll lock and swipe down to close.
- Dropped row no longer jumps back for a frame.

## 0.5.0 — 2026-11-12

- Mutations moved into `data/hooks`; `useAction` for one-off actions; `notify()` toasts.
- One `SheetHost` renders every sheet; screens call `openSheet()`.
- One component per file; settings split into groups; shared form and settings components.
- Startup: last launch snapshot, home data requested in parallel, preconnect, vendor chunks.

## 0.4.0 — 2026-11-11

- `to_buy` flag independent of stock (migration `0005`, trigger for older clients).
- Stock dot on the product icon, "+ / −" to put on or take off the list.
- Shopping shows "still at home" / "ran out"; swipe removes without buying.
- One-off products can run out.
- Floating tab buttons with a shopping counter.
- i18n: Russian, English, Japanese, Vietnamese; plural forms, dates, language picker.
- Emoji suggestions in all four languages.
- Sign out for Google accounts; Google always shows the account picker.

## 0.3.0 — 2026-11-10

- Optional Google sign-in: a welcome screen for new visitors, a button in settings.
- Merging the device's anonymous user into the account via a one-time ticket.
- A choice screen when both the device and the account have homes with data.
- Device labels and account emails for members (`sync_profile`).
- Invite links survive the redirect to Google.

## 0.2.0 — 2026-11-10

- No sign-up: an anonymous user and a home are created on first launch.
- One-time invite links (7 days, stored as a hash), revoke, join by pasting a link.
- Member display names; the owner can remove members.
- Emoji suggestions by product name.
- Optimistic updates with rollback and toasts; client-generated ids.
- Memoized rows, batched realtime refetch, screen and section transitions.
- Vercel config; demo mode for automated browsers; `noindex`.
- Email sign-in and email invites removed.

## 0.1.0 — 2026-11-08

First working version (MVP).

- Custom sections: create, rename, delete (a non-empty one only after confirmation).
- Staple and one-off products with emoji and a stock mark.
- Shopping list built from staples that ran out plus manual items.
- "Bought" on a manual item asks for a section and can make it a staple.
- Swipe to delete, with a button for keyboard and screen reader users.
- Light and dark theme.
- Supabase: schema with row level security, email code sign-in, a shared home,
  email invites, live sync between members.
- PWA: manifest, icons, cached app shell.
- Demo mode in `localStorage` when Supabase isn't configured.
