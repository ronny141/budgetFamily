## Context

See proposal.md - Why. This is the first OpenSpec change in budgetFamily, so there is no existing backend, data model, or auth state to build on — this design also sets the initial technical foundation (backend choice, session handling pattern) that later changes (expense-tracking, budget-planning, family-sharing) will build on.

## Goals / Non-Goals

**Goals:**
- Stand up Supabase as the auth/data backend for the project.
- Implement registration, login, logout, and persisted sessions per `specs/user-auth/spec.md`.
- Establish a shared pattern (client setup, session state, protected routing) that later changes reuse instead of re-deciding.

**Non-Goals:**
- Household/family sharing and permissions (covered by the later `add-family-sharing` change) — this change only creates individual user accounts.
- Password reset / email verification flows — not required by the spec's scenarios; can be added later without changing this design.
- Any expense, category, or budget data modeling.

## Decisions

**Backend: Supabase (Auth + Postgres).**
Chosen over Firebase because the family-sharing capability planned later needs two users to read/write the same rows (household expenses and budget) under access rules — Postgres Row Level Security policies express "only members of household X can access these rows" directly, whereas Firestore would need denormalized security rules per collection. Chosen over a custom backend because it removes the need to stand up and operate our own auth/API server before any user-facing feature exists.

**Client: `@supabase/supabase-js` with Expo's `expo-secure-store` (or AsyncStorage, if `expo-secure-store` proves impractical for cross-platform storage during implementation) as the session storage adapter**, wired through `createClient(url, anonKey, { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })`.
This is the standard pattern for using supabase-js in React Native/Expo — `detectSessionInUrl: false` avoids the web-only URL-based session detection path, and a custom `storage` adapter is required because supabase-js defaults to `localStorage`, which doesn't exist in React Native.

**Session state: a single auth context/provider at the app root**, subscribing to `supabase.auth.onAuthStateChange`, exposing `{ user, session, isLoading }` to the rest of the app.
Centralizing this avoids every screen independently querying Supabase for the current user, and gives later changes (expense-tracking, etc.) one place to read "who is the current user."

**Routing: gate authenticated routes at the root layout** using `expo-router`'s layout redirect pattern (redirect to a login screen when there is no session, redirect away from login/register when there is one).
Keeps auth-gating logic in one place rather than duplicated per screen.

**Email confirmation: disabled ("Confirm email" turned off in the Supabase dashboard).** Supabase projects default to requiring email confirmation before `signUp` returns a session, which would conflict with the "Successful registration" scenario (immediate session) and, during apply, ran into Supabase's very low default email-sending rate limit before a custom SMTP provider is configured. Disabling it keeps registration simple and matches the spec as written. Re-enabling email confirmation is deliberately deferred as backlog work for a future change - it will need its own spec update (a "pending confirmation" state) and is out of scope here.

**Duplicate registration write safety:** `signUp`'s profile-row write uses `upsert` (not `insert`) rather than assuming the profiles row never already exists for a given user id - defensive, and costs nothing since the id is always the authenticated user's own.

## Risks / Trade-offs

- **New external dependency (Supabase project/account)** → Requires creating a Supabase project and storing its URL/anon key as app config before this change can be implemented; document this as a first task.
- **`expo-secure-store` has platform size limits and no web support** → Mitigation: confirm during implementation whether `expo-secure-store` or `@react-native-async-storage/async-storage` is the better fit for this project's target platforms (the tasks below start with `expo-secure-store` per Supabase's documented Expo pattern, but this can be swapped without changing the spec).
- **RLS policies are easy to misconfigure (accidentally too permissive or too restrictive)** → Mitigation: for this change, restrict RLS to "a user can only read/write their own row" on the users/profile table; broader household-sharing policies are deferred to `add-family-sharing`, which will need its own careful review.
## Open Questions

None — the backend and session-handling approach are decided above; anything not covered here (password reset, email verification) is explicitly a non-goal, not a deferred decision.
