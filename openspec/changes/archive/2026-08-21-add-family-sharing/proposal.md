## Why

budgetFamily has been single-user so far. The whole point of the app, per the original idea, is for two household members to manage money together: see each other's expenses, edit them, and share one budget instead of two separate ones. This change turns the app from single-user to a shared household of exactly two people.

## What Changes

- Add a household concept: every user has exactly one household (created transparently the first time it's needed) with a shareable invite code.
- Add joining a household via another user's invite code — limited to exactly two members per household.
- Make expenses and categories visible and editable by both household members, not just the person who created them.
- Make the monthly budget per category a single household-wide limit (not per-person), and make the monthly overview (total income, spend vs. budget) combine both members' data.
- Make income visible and editable by both household members.

## Capabilities

### New Capabilities
- `family-sharing`: household identity/invite codes, joining a household, and the shared-access rule that both existing capabilities below rely on.

### Modified Capabilities
- `expense-tracking`: expenses and custom categories become visible/editable by a user's household member, not just their creator.
- `budget-planning`: budget limits move from per-user to per-household (one limit per category, shared), and the monthly overview combines both household members' income and expenses.

## Impact

- New database tables (`households`, `household_members`) and a `household_member_ids(uid)` SQL function used by RLS policies across `categories`, `expenses`, `income`, and `budgets`.
- `budgets` table is re-keyed from `(user_id, category_id)` to `(household_id, category_id)` — an existing table's schema changes.
- RLS policies on `categories`, `expenses`, and `income` change from strictly self-scoped to household-scoped for read/write.
- Out of scope: households larger than two people, leaving/removing a household member, merging a joining user's pre-existing budgets into the household they join (they adopt the household's existing budgets instead), and any invite mechanism beyond an in-app code (no email invites, consistent with the app's earlier email-sending limitations).
