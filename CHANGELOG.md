# Changelog

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
