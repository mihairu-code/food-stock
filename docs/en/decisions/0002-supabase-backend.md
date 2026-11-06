# 0002. Supabase as the backend

**Status:** accepted · November 2026

## Context

I need storage, sign-in, data split by home, and live sync between members. I don't
want to write a server — I want to get to a working MVP fast.

## Options

- **My own Go API + Postgres.** I'm slowly learning Go, so it would be good practice.
  But it's auth, CRUD, websockets and a server deploy — a week or two just for what
  Supabase gives out of the box.
- **Firebase.** Quick, but it's a document model: the "home → sections → products"
  relations and cascade deletes would have to be kept by hand on the client.
- **Supabase.** Plain Postgres, auth, Realtime, row level security. The client talks to
  the database directly, access rules live in SQL.

## Decision

Supabase: Postgres + Auth + Realtime. Every data table hangs off `household_id` and is
locked by an RLS policy "I only see homes I'm a member of". Actions that must succeed as
a whole (accept an invite, buy a manual item) are database functions (RPC).

On the client — one storage interface, `Backend`, with two implementations: Supabase and
a local demo in `localStorage`. The demo lets me build the UI without touching the
database, and lets anyone run the project without keys.

## Consequences

- Security rests on RLS, so the policies need tests — against real Postgres, not mocks.
- The `service_role` key never goes to the client.
- Go goes on the shelf. If I ever need server-side logic — Edge Functions or a small
  service next to it.
