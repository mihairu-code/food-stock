# 0022. A member can leave a home

**Status:** accepted · November 2026

## Context

Before v1.3.1 the only way out of a home was for the owner to remove the member. The
function `private.leave_home` has existed since 0004, but only account merging and the
removal of abandoned anonymous users (0011) called it. Someone who joined the wrong home
by a link, or moved out, stayed in someone else's home, and the home stayed in their list.

Options:

1. Keep it as is: only the owner removes. The member has to ask.
2. Let a member delete their own row directly through an RLS policy. A leaving owner would
   then leave the home without an owner: a policy can't hand ownership over.
3. A separate function `public.leave_household` on top of `private.leave_home`.

## Decision

Option three.

- `public.leave_household(p_household_id)` (migration 0013, additive only) checks that
  the caller is a member of the home and calls `private.leave_home`. If the owner leaves,
  the member who has been in the home the longest becomes the owner (by `created_at`,
  ties broken by id). Items, sections and invite links stay in the home.
- The function refuses the last member: the home would be deleted along with its items,
  which is deleting a home, not leaving it. The app doesn't show them the row.
- The "Leave home" row is in the settings, in the Home group, with a confirmation: access
  goes away and the only way back is a new link. When the owner leaves, the confirmation
  names the new owner; `nextOwner` in `entities/member` picks them by the same rule as the
  database.
- After leaving, another home opens. If there is none, the app creates a new empty one,
  as on first launch. Toast: "You left “…”".
- Leaving is marked before the request (`markLeftHousehold`): the Realtime event can
  arrive before the response, and without the mark the app would say "You were removed
  from the home".
- Demo mode has no such row: it has one home and one member.

## Consequences

- Deleting a whole home still isn't possible from the app: a lone owner has nowhere to
  leave to.
- Rollout order: migration 0013 first, then the merge into `main`. Without the migration
  the row is shown but leaving ends with an error toast.
