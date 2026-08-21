## 1. Household schema

- [ ] 1.1 Create a migration for `households` (id, invite_code unique, created_at) and `household_members` (household_id, user_id unique, joined_at, pk on household_id+user_id), both with RLS allowing a user to read rows where `user_id = auth.uid()` or `household_id` matches their own membership; verify by running the migration in the Supabase SQL editor without errors
- [ ] 1.2 Add the `household_member_ids(uid)` SQL function (always includes `uid` itself via `union`, plus any co-members); verify by calling it via the SQL editor for a user with no household (returns just themselves) and for two members of the same household (returns both)
- [ ] 1.3 Add a `profiles` select policy allowing a user to read a household member's profile row, in addition to their own; verify by querying another household member's profile as an authenticated test user and confirming it's visible only once they share a household

## 2. Household-aware RLS on existing tables

- [ ] 2.1 Update RLS on `categories` (select/update/delete via `household_member_ids`, insert unchanged) and `expenses` (same pattern) in a migration; verify by having two household members each create data and confirming both can see and edit each other's rows, while a third unrelated test user sees neither
- [ ] 2.2 Update RLS on `income` the same way; verify the same way

## 3. Re-key budgets to household

- [ ] 3.1 Write the `budgets` re-key migration: add `household_id`, backfill it (creating a household + membership per distinct existing `user_id`), drop `user_id` and its unique constraint, add `household_id` not-null and `unique (household_id, category_id)`, replace RLS with the household-membership check; verify by running it and confirming existing budget rows still return correctly for their original user
- [ ] 3.2 Update `lib/budgets.ts`'s `setBudget`/`listBudgets` to key off `household_id` obtained via `getOrCreateHouseholdId()` instead of `user_id`; verify with `tsc --noEmit` and by setting a budget as a fresh user with no household yet (confirms the lazy-create path)

## 4. Family data access layer

- [ ] 4.1 Implement `lib/family.ts` with `getOrCreateHouseholdId()` (idempotent lookup-or-create with a generated invite code) and `getMyHousehold()` (household id, invite code, member count); verify with `tsc --noEmit`
- [ ] 4.2 Implement `joinHousehold(code)`: validate the code exists, reject if the target household already has two members, then move the caller into it; verify the "Successful join", "Invalid invite code rejected", and "Household already full rejected" scenarios from specs/family-sharing/spec.md

## 5. Household screen

- [ ] 5.1 Add a "Hogar" screen showing the current user's invite code (creating their household transparently on first visit) and a form to join another household by code; verify the "Household created automatically on first use" scenario shows a code with no prior setup
- [ ] 5.2 Wire the join form to `joinHousehold` and surface its errors; verify invalid-code and household-full scenarios show the expected messages

## 6. Shared expenses, categories, and income

- [ ] 6.1 Verify the "Listing expenses" and "Editing an expense"/"Deleting an expense" scenarios end-to-end with two household members: each sees and can edit/delete the other's expenses, and neither sees an unrelated third user's
- [ ] 6.2 Verify the "Creating a custom category" scenario: a category created by one household member appears in the other's category list
- [ ] 6.3 Verify the "Listing income" and its editing/deleting scenarios end-to-end the same way as 6.1, for income

## 7. Combined budgets and monthly overview

- [ ] 7.1 Verify the "Setting a budget limit" and "Household member sees the same limit" scenarios: one member sets a category limit, the other sees the identical limit
- [ ] 7.2 Update `getMonthlyIncomeTotal()` and `getMonthlySpendByCategory()` (in `lib/income.ts`/`lib/expenses.ts`) to sum across `household_member_ids(auth.uid())` instead of just the current user; verify the "Viewing total income for the month" and "Viewing spend vs. budget per category" scenarios combine both members' entries
