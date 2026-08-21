## Context

See proposal.md - Why. Builds on both `add-user-auth` (per-user RLS pattern) and `add-expense-tracking` (reuses its `categories` table and `expenses` data to compute spend). "Monthly" always means the current calendar month (1st through the last day), per the earlier decision to keep budgets simple: one limit per category, evaluated fresh every month rather than requiring a new limit to be set each month.

## Goals / Non-Goals

**Goals:**
- Let a user record, list, edit, and delete income entries, optionally in a currency other than COP.
- Convert non-COP income to COP using a manually-entered exchange rate, so all totals are comparable.
- Let a user set one monthly budget limit per category, editable at any time.
- Let a user see a monthly overview: total income this month (in COP), and spend-vs-limit per category this month.

**Non-Goals:**
- Sharing income/budgets with another household member — that's `add-family-sharing`.
- A dedicated cross-capability dashboard beyond this change's own overview screen — `add-dashboard` builds further on this data later; this change only needs to satisfy its own "Monthly overview" requirement.
- Budgets that vary by month or roll over unspent amounts — a single limit applies to every calendar month, per the earlier decision.
- Recurring/scheduled income — each entry is recorded individually, same as expenses.
- Multi-currency expenses or budgets — only income supports a non-COP currency in this change; expenses/budgets stay COP-only.
- Live or automatic exchange rates — the rate is entered manually by the user at the time of recording; no external FX API integration, and no attempt to validate the rate against a real market rate.

## Decisions

**Data model: two more tables, same per-user RLS pattern as `expenses`.**
```sql
income (
  id uuid pk,
  user_id uuid not null references auth.users,
  currency text not null default 'COP',
  original_amount numeric(12,2) not null check (original_amount > 0),
  exchange_rate numeric(12,6) not null default 1 check (exchange_rate > 0),
  amount_cop numeric(12,2) generated always as (round(original_amount * exchange_rate, 2)) stored,
  income_date date not null,
  description text null,
  created_at
)
budgets (id uuid pk, user_id uuid not null references auth.users, category_id uuid not null references categories, monthly_limit numeric(12,2) not null check (monthly_limit > 0), created_at, unique (user_id, category_id))
```
`amount_cop` is a Postgres *generated* column, not something the app computes and writes itself - this guarantees it can never drift from `original_amount * exchange_rate`, even if a row is edited directly. A plain COP entry just uses the column defaults (`currency = 'COP'`, `exchange_rate = 1`), so `amount_cop` equals `original_amount` with no special-casing needed in the client. `budgets` has a unique constraint on `(user_id, category_id)` so "setting" and "updating" a limit are the same operation: an `upsert`. RLS on both tables is full CRUD scoped to `user_id = auth.uid()`, identical in shape to `expenses`.

**Currency validation happens client-side before insert**: if the submitted currency (case-insensitively) is not `COP`, the exchange rate field becomes required and must be a positive number; the "Missing exchange rate rejected" scenario is enforced there, backed by the `exchange_rate > 0` check constraint as defense-in-depth. The currency code itself is free-text (e.g. `USD`), not validated against a fixed list - keeping this scoped to what's needed rather than building full ISO-4217 validation.

**"Current calendar month" is computed client-side** (first and last day of the current month in the device's local time), passed as a date range filter when querying `expenses` and `income` - no new server-side date logic or Postgres functions needed.

**Navigation: add a third tab ("Resumen") for income and the monthly overview**, rather than overloading the existing two tabs. Reasoning: expense-tracking's tabs are already single-purpose (Gastos, Categorías); income and the overview are conceptually a third concern, so a third tab keeps each screen focused.

**Budget limits live on the existing Categorías tab** (from `add-expense-tracking`), as an editable field next to each category, rather than a separate screen — a budget limit is a property of a category, so editing it where categories are already listed avoids a redundant screen.

**Income add/edit reuses the existing modal pattern**: a new `app/income-modal.tsx` route (parallel to `add-expense-tracking`'s reuse of `modal.tsx`), registered in the root `Stack` next to the expense modal.

**Client modules: `lib/income.ts` and `lib/budgets.ts`**, following the same shape as `lib/expenses.ts` - thin wrappers over `supabase.from(...)` calls. `createIncome`/`updateIncome` take `{ currency, originalAmount, exchangeRate, date, description }`; `amount_cop` is never sent by the client, since the database computes it. A `getMonthlySpendByCategory()` helper (in `lib/expenses.ts`, since it queries `expenses`) returns spend totals grouped by `category_id` for the current month; the overview sums `amount_cop` (not `original_amount`) when totaling income.

## Risks / Trade-offs

- **Computing monthly totals client-side means fetching all of the month's expenses/income on every overview visit** → Acceptable at this scale (a single household, one month of data); revisit with a server-side aggregate (a Postgres view or RPC) only if this becomes slow.
- **RLS misconfiguration** → Mitigated the same way as prior changes: policies scope strictly to `auth.uid()`, mirroring the already-working `expenses` pattern.
- **A manually-entered exchange rate can be wrong or stale, silently skewing every COP total** → Accepted per the earlier decision to keep this manual rather than adding a live-rate dependency; the user is responsible for entering a reasonable rate.
- **Found during apply: the income form defaulted a blank/invalid exchange rate to `1` client-side** (`Number(exchangeRate) || 1`) before validation ran, which both defeated the "Missing exchange rate rejected" scenario and would have silently mis-converted a non-COP entry as if it were 1:1 → Fixed: the client only defaults to `1` when the currency actually is COP; any other currency passes the raw parsed value through to validation, so a missing/invalid rate is correctly rejected instead of silently assumed.

## Open Questions

None — the data model, month-boundary handling, and navigation are decided above.
