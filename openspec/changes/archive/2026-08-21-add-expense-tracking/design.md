## Context

See proposal.md - Why. Builds directly on `add-user-auth`: every expense and custom category belongs to the authenticated user, using the same Supabase + RLS pattern already established for `profiles`.

## Goals / Non-Goals

**Goals:**
- Let a user record, list, edit, and delete their own expenses, each in a category.
- Let a user use a starter set of predefined categories or add their own.
- Reuse the existing app navigation (two tabs) rather than introducing new navigation structure.

**Non-Goals:**
- Sharing expenses/categories with another household member — that's `add-family-sharing`.
- Budgets or spend-vs-budget comparisons — that's `add-budget-planning`.
- Renaming or deleting a custom category once created — not required by the spec; can be added later without changing this design.
- Multiple currencies — a single implicit currency for all amounts.

## Decisions

**Data model: two tables, both under the same per-user RLS pattern as `profiles`.**
```sql
categories (id uuid pk, owner_id uuid null references auth.users, name text not null, created_at)
expenses   (id uuid pk, user_id uuid not null references auth.users, category_id uuid not null references categories, amount numeric(12,2) not null, expense_date date not null, description text null, created_at)
```
`categories.owner_id` is `null` for the predefined starter set (visible to everyone) and a user's own id for a custom category (visible only to its creator). RLS: `select` where `owner_id is null or owner_id = auth.uid()`; `insert` with check `owner_id = auth.uid()` (a user can only create categories owned by themselves, never a global one). `expenses` RLS is full CRUD scoped to `user_id = auth.uid()`, identical in shape to `profiles`' policies from `add-user-auth`.

**Predefined categories are seeded once via SQL migration** (Comida, Transporte, Entretenimiento, Servicios, Salud, Otros), inserted with `owner_id = null` directly in the migration - not through the app, since RLS's insert policy deliberately blocks the app from creating global categories.

**Amount validation: client-side check plus a database constraint** (`amount > 0`) as defense-in-depth, since the anon key could otherwise be used to write directly to the table bypassing the app's form validation.

**Navigation: reuse the existing two-tab layout instead of adding new tabs.** Tab One becomes the expense list ("Gastos"); Tab Two becomes category management ("Categorías"). Adding or editing an expense reuses the existing `modal.tsx` route already wired into the root `Stack`, parameterized with an optional expense id for editing.

**Client module: `lib/expenses.ts`**, following the same shape as `lib/auth.ts` - `listCategories`, `createCategory`, `listExpenses`, `createExpense`, `updateExpense`, `deleteExpense`, each a thin wrapper over `supabase.from(...)` calls using the client from `lib/supabase.ts`.

## Risks / Trade-offs

- **No way to fix a mistyped custom category name in this change** → Accepted for now; renaming/deleting categories is explicitly a non-goal and can be added later without a design change.
- **RLS misconfiguration** → Mitigated the same way as `add-user-auth`: policies scope strictly to `auth.uid()`, mirroring the already-working `profiles` pattern.
- **`Alert.alert` (used for the delete confirmation) silently no-ops on react-native-web** (found during apply: no dialog, no error, deletion just never happened on web) → Fixed with a `Platform.OS === 'web'` branch that uses `window.confirm` instead; native platforms keep the standard `Alert.alert`.

## Open Questions

None — the data model, RLS approach, and navigation reuse are decided above.
