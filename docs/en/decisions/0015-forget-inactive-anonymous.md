# 0015. Anonymous users who haven't visited for a year are deleted

**Status:** accepted · November 2026

## Context

Without sign-up a person is an anonymous Supabase user on one device
([0003](0003-anonymous-users.md)). Lost the phone, deleted the app, cleared browser data —
there's no way back to that user, while the home with its products stays in the database
forever. Over time there will be more such records than live ones.

## Options

- **Delete nothing.** Simple, but the database fills with garbage, and shared homes keep
  "members" who no longer exist.
- **Delete by `last_sign_in_at`.** An anonymous user signs in once, then the session is
  refreshed — the sign-in date says nothing about whether the app is used.
- **A visit mark of our own and a daily cleanup by it.**

## Decision

- `0010`: table `private.user_activity` — the last visit. The app marks it (`mark_visit`)
  on launch and when coming back to it, at most once a day per device; the database
  doesn't rewrite the mark more often than once an hour. For users from before the
  migration the date isn't "today" (otherwise an anonymous user who hadn't visited for 300
  days would get an extra year) but an estimate: from sessions and refresh tokens, then
  from the last sign-in and creation.
- `0011`: `private.forget_inactive_anonymous()` — daily at 03:17 UTC (`pg_cron`). Only
  anonymous users who haven't visited for over a year are deleted: by the visit mark and,
  for older app versions, by session refreshes. Google accounts are untouched: a person
  can sign in from any device. A lone user goes with their home; from a shared home only
  they leave, and the longest-standing member becomes the owner.
- The app can't call the cleanup, and with a period shorter than a year the function
  refuses even when called by hand.

## Consequences

- This is the only deletion without a person involved; change its rules deliberately.
- A year is generous: a summer-house home visited in summer won't disappear.
