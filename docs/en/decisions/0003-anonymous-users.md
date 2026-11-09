# 0003. Anonymous users instead of sign-up

**Status:** accepted · November 2026

## Context

v0.1 signs in with a code from an email. In practice:

- on a phone that means switching to mail, finding the email, copying the code, coming
  back;
- Supabase's built-in mail only reaches members of the organisation, everyone else needs
  your own SMTP;
- an email invite only works once the person signs in with that exact address.

For a home list shared by 2–4 people that's far too high a bar.

## Options

- **Keep email and plug in SMTP (Resend or similar).** Fixes delivery, not the phone
  hassle.
- **A shared secret code per home.** Simple, but the code lives forever and leaks
  forever.
- **A Supabase anonymous user + an invite link.** On first launch a user
  (`signInAnonymously`) and a home are created silently. The second person is invited
  with a link.

## Decision

Anonymous users and one-time links:

- an anonymous user has its own `auth.uid()`, so every RLS policy stays as it was;
- a link works once and lives 7 days; the database stores only a hash of the token —
  a ready link can't be read back from the table, it's shown once when created;
- instead of an email a member has an optional name;
- the empty home created automatically on first launch is deleted when the person joins
  someone else's — otherwise every invited person would carry an empty home around.

## Consequences

- The user lives in browser storage. Clear site data or switch phones and you're a new
  person to the system. An account linked later fixes that.
- On iPhone, Safari and the home screen app have separate storage: a link from
  a messenger opens in Safari. So settings need a "Join by link" button where the link can
  be pasted.
- Anonymous sign-in lets anyone create users in the project. Supabase rate-limits it per
  IP; a public launch will need a captcha.
