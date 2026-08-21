## 1. Database schema

- [x] 1.1 Create a migration for the `income` table (id, user_id, currency default `'COP'`, original_amount numeric(12,2) with a `> 0` check, exchange_rate numeric(12,6) default 1 with a `> 0` check, amount_cop as a generated column `round(original_amount * exchange_rate, 2)`, income_date, description, created_at) with RLS scoped to `user_id = auth.uid()` for select/insert/update/delete; verify by running the migration in the Supabase SQL editor without errors
- [x] 1.2 Create a migration for the `budgets` table (id, user_id, category_id, monthly_limit numeric(12,2) with a `> 0` check, created_at, unique on `(user_id, category_id)`) with the same RLS pattern; verify the same way

## 2. Data access layer

- [x] 2.1 Implement `lib/income.ts` with `listIncome`, `createIncome`, `updateIncome`, `deleteIncome`, `getIncome`, taking `{ currency, originalAmount, exchangeRate, date, description }` and never sending `amount_cop` (the database computes it); verify with `tsc --noEmit`
- [x] 2.2 Implement `lib/budgets.ts` with `listBudgets` and `setBudget` (upsert on `user_id, category_id`); verify with `tsc --noEmit`
- [x] 2.3 Add `getMonthlySpendByCategory()` to `lib/expenses.ts`, returning spend totals grouped by category for the current calendar month; verify by calling it against test data and checking the totals match

## 3. Budget limits

- [x] 3.1 Add an editable monthly-limit field next to each category on the Categorías tab, wired to `setBudget`; verify the "Setting a budget limit" and "Updating a budget limit" scenarios from specs/budget-planning/spec.md
- [x] 3.2 Validate the limit amount before saving; verify the "Invalid budget limit rejected" scenario shows the expected message without saving

## 4. Income

- [x] 4.1 Add `app/income-modal.tsx` (amount, currency, date, optional description, defaulting currency to COP) for creating/editing income, registered in the root `Stack`; verify the "Successful income creation in the base currency" scenario creates an entry attributed to the current user
- [x] 4.2 Show an exchange-rate field when the currency is not COP, and validate: a positive amount always, and a positive exchange rate whenever the currency isn't COP; verify the "Successful income creation in another currency", "Invalid income amount rejected", and "Missing exchange rate rejected" scenarios
- [x] 4.3 Add an income list (in the new Resumen tab) showing only the current user's entries, each with its original amount/currency and converted COP amount, with edit and delete actions; verify the "Listing income", "Editing an income entry", and "Deleting an income entry" scenarios

## 5. Monthly overview

- [x] 5.1 Add the third tab ("Resumen") showing total income (in COP) for the current calendar month; verify the "Viewing total income for the month" scenario sums each entry's converted COP amount within the current month
- [x] 5.2 Show spend vs. budget limit per category for the current month on the same tab; verify the "Viewing spend vs. budget per category" and "Category without a budget limit" scenarios
