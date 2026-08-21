## Context

See proposal.md - Why. This change touches three already-archived capabilities' data layer: `user-auth` (not modified, but its `profiles` table needs a visibility change — see Decisions), `expense-tracking`, and `budget-planning`. Both `expense-tracking` and `budget-planning` currently scope every table strictly to `user_id = auth.uid()`; this change replaces that with household-aware visibility.

## Goals / Non-Goals

**Goals:**
- Every user has exactly one household, created transparently — no explicit "create household" action to build.
- Joining a household via an invite code, capped at two members.
- Expenses, categories, and income become visible/editable by both household members.
- Budget limits and the monthly overview become household-combined, not per-person.

**Non-Goals:**
- Households of more than two people, or a user belonging to more than one household.
- Leaving a household or removing a member — not requested; can be added later.
- Migrating a joining user's pre-existing solo budgets into the household they join — they adopt the household's existing budgets instead. Their old budgets become orphaned under their now-abandoned solo household and are simply no longer shown.
- Email-based invites — an in-app invite code only, consistent with the app's earlier email rate-limit issues (see `add-user-auth`'s design.md).
- Any change to `expenses`/`income`/`categories` table columns — only their RLS policies change; `user_id` still records who originally created each row.

## Decisions

**Data model: two new tables plus a household-membership function.**
```sql
households (id uuid pk, invite_code text unique not null, created_at)
household_members (household_id uuid references households, user_id uuid references auth.users unique, joined_at, primary key (household_id, user_id))
```
`household_members.user_id` has its own `unique` constraint (independent of the composite primary key) so a user can belong to at most one household — enforced by the database, not just application logic.

**A single SQL function backs every household-aware RLS policy:**
```sql
create or replace function public.household_member_ids(uid uuid)
returns setof uuid
language sql stable security definer set search_path = public as $$
  select uid
  union
  select hm2.user_id
  from household_members hm1
  join household_members hm2 on hm2.household_id = hm1.household_id
  where hm1.user_id = uid;
$$;
```
It always includes the user themselves (via the `union`), so a user with no household row yet still sees only their own data — no eager household creation needed for `categories`/`expenses`/`income`. Every RLS policy on those three tables changes from `user_id = auth.uid()` to `user_id = ANY (select household_member_ids(auth.uid()))` for **select**; **insert** stays `user_id = auth.uid()` (a new row is always attributed to whoever creates it); **update**/**delete** move to the same household-member check as select, which is what grants a household member permission to edit or delete an entry they didn't create.

**`profiles` gains a household-visibility select policy** (in addition to its existing self-only one), so the app can show a household member's display name (e.g., "recorded by Laura"). This is a data-layer change only — `user-auth`'s spec never made a claim about cross-user profile visibility, so it needs no delta there.

**`budgets` is re-keyed from `(user_id, category_id)` to `(household_id, category_id)`**, since the decision is one shared limit per category per household, not per person. This requires: every user to have a household by the time they set a budget (lazy creation happens here, not for the other tables), and a migration for the table itself:
1. Add a nullable `household_id` column.
2. For each distinct `user_id` currently in `budgets`, create a household + membership row for that user, and set `household_id` on their rows accordingly (test data at this stage, so a straightforward backfill is safe).
3. Drop `user_id`, make `household_id not null`, replace the old `unique (user_id, category_id)` with `unique (household_id, category_id)`.
4. Replace RLS: select/insert/update/delete all become `household_id in (select household_id from household_members where user_id = auth.uid())`.

**Household creation is lazy and idempotent, driven by `getOrCreateHouseholdId()`** in a new `lib/family.ts`: look up the caller's `household_members` row; if absent, insert a new `households` row (with a generated invite code) and a `household_members` row for them, and return that id. `setBudget` calls this before writing. The household screen also calls it on load, so visiting it is what "creates a household transparently the first time it's needed."

**Joining a household**: given a code, look up the matching `households` row, count its current members (reject if 0 rows found → invalid code; reject if already 2 → full), then replace the caller's `household_members` row (delete their old one if present, insert the new one). This is a single client-side flow of a few sequential queries — no stored procedure needed at this scale.

**Invite code format**: a short random string (e.g. 8 alphanumeric characters), generated client-side at household-creation time and stored as-is; uniqueness is enforced by the column's `unique` constraint, with a retry-on-conflict loop (extremely unlikely to collide, but cheap to handle).

## Risks / Trade-offs

- **`security definer` on `household_member_ids`** → Necessary so the function can read `household_members` rows belonging to another user (to find their co-member) even though the caller's own RLS wouldn't otherwise permit it; the function only ever returns user ids, never other data, so this doesn't leak anything beyond what the feature requires.
- **Re-keying `budgets` on top of existing (test) data** → Acceptable now since all current rows are test data from earlier verification sessions, not real user data.
- **A user could join and immediately overwrite the household's budgets** (since both members have equal write access) → Accepted, consistent with "mismos permisos de edición" already decided for expenses/income.
- **Orphaned solo households/budgets after a join** → Accepted per the non-goals above; harmless leftover rows, not surfaced anywhere.

## Open Questions

None — the data model, household-membership function, and re-keying approach are decided above.

## Found during apply

- **"infinite recursion detected in policy for relation household_members"**: the original `household_members` SELECT policy queried `household_members` from inside its own `USING` clause (`... or household_id in (select household_id from household_members where user_id = auth.uid())`), which re-triggers the same policy on itself. Fixed with a `security definer` helper function (`my_household_id(uid)`) that bypasses RLS internally, used by that policy and by `households`'/`budgets`' policies instead of a raw self-referencing subquery.
- **RLS chicken-and-egg on `households` insert**: `getOrCreateHouseholdId()` originally did `.insert({...}).select().single()`. PostgREST's `return=representation` tries to read the just-inserted row back, but the "read your own household" SELECT policy can't yet see it — the caller isn't a `household_members` row yet at that point — so the read-back fails and surfaces as a confusing "new row violates row-level security policy for table households" error, even though the insert itself was fine. Fixed by inserting without requesting the row back (`return=minimal`), then looking the new household's id up via the existing `find_household_by_code` RPC (which bypasses this gap by design) before creating the membership row.
- **Every error message in the app showing as "[object Object]"**: all the UI's `catch` blocks used `err instanceof Error ? err.message : String(err)`, but Supabase/Postgrest errors are plain objects, not `Error` instances, so that check always fell through to `String(err)`. Fixed with a shared `getErrorMessage()` helper in `lib/errors.ts` that also unwraps a `.message` property from plain error-shaped objects, applied everywhere that pattern appeared.
