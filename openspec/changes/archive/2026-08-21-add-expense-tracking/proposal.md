## Why

With login in place (`add-user-auth`), budgetFamily has users but nothing for them to do yet. Tracking expenses by category is the core, most immediately useful piece of a budget app, and it's the foundation the later `add-budget-planning` (spend vs. budget per category) and `add-dashboard` (summary view) changes build on.

## What Changes

- Add expense categories: a starter set of predefined categories, plus the ability for a user to create their own.
- Add expense entries: amount, category, date, and an optional description, each attributed to the user who created it.
- Add the ability to list, edit, and delete a user's own expenses.

## Capabilities

### New Capabilities
- `expense-tracking`: creating/editing/deleting expenses, each assigned to a category, plus managing the category list (predefined + custom).

### Modified Capabilities
(none)

## Impact

- New screens: expense list, add/edit expense, manage categories.
- New database tables (`categories`, `expenses`) with RLS scoped to the owning user, following the same per-user pattern as `profiles` from `add-user-auth`.
- Depends on the auth session established in `add-user-auth` to attribute expenses/categories to a user.
- Out of scope: sharing expenses with another household member (that's `add-family-sharing`) and budget limits per category (that's `add-budget-planning`) — expenses here are single-user only.
