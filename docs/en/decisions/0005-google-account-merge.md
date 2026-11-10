# 0005. Google account and merging the device user

**Status:** accepted · November 2026

## Context

After [0003](0003-anonymous-users.md) a person is a device. New phone, cleared Safari,
installed the app to the home screen — and they're a different user, sometimes without
a home. On iPhone one person easily becomes two: Safari and the app.

I need an optional account that makes a person the same everywhere, without bringing
mandatory sign-up back.

## Options

- **Link Google to the anonymous user (`linkIdentity`).** Only works while the account
  has no user of its own. On the same person's second device linking fails — the account
  is taken.
- **Sign in with Google and move the device's data into the account.** The device's
  anonymous user merges into the account: its homes move over, the anonymous user is
  deleted.
- **Apple ID.** Needs the paid Apple Developer Program and a secret re-issued every six
  months. Postponed.

## Decision

Google sign-in plus a merge:

1. Before going to Google the device takes a one-time **ticket** (`create_merge_ticket`).
   Only its hash is stored; the `private` schema is closed to the Data API.
2. After coming back the account presents the ticket — proof that this device's
   anonymous user belongs to the same person.
3. `preview_merge` tells whether there's a conflict: the device and the account have
   different homes with data. Then the person picks which to keep; nothing merges without
   a choice.
4. `complete_merge` moves memberships, removes duplicates and the anonymous user. Empty
   auto-created homes need no choice and don't pile up.
5. So members can tell each other apart without an account, a member now has a device
   label ("Safari · iPhone") and the account email.

Migration `0004` only adds — v0.2 keeps working (see [0004](0004-safe-updates.md)).

## Consequences

- The merge is the most complex function in the database; it has its own tests,
  including attempts to use someone else's ticket.
- Google sign-in is optional: while the provider is off, the app behaves like v0.2.
- An invite link has to survive the round trip to Google — the hash is lost on the way,
  so the token is parked in `localStorage`.
