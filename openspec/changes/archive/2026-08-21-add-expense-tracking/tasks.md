## 1. Database schema

- [x] 1.1 Create a migration for the `categories` table (id, owner_id nullable, name, created_at) with RLS: select where `owner_id is null or owner_id = auth.uid()`, insert with check `owner_id = auth.uid()`; verify by running the migration in the Supabase SQL editor without errors
- [x] 1.2 Create a migration for the `expenses` table (id, user_id, category_id, amount numeric(12,2) with a `> 0` check constraint, expense_date, description, created_at) with RLS scoped to `user_id = auth.uid()` for select/insert/update/delete; verify the same way
- [x] 1.3 Seed the predefined categories (Comida, Transporte, Entretenimiento, Servicios, Salud, Otros) with `owner_id = null` in the migration; verify by querying the table and seeing all six rows

## 2. Data access layer

- [x] 2.1 Implement `lib/expenses.ts` with `listCategories`, `createCategory`, `listExpenses`, `createExpense`, `updateExpense`, `deleteExpense`, each wrapping a `supabase.from(...)` call; verify with `tsc --noEmit`

## 3. Categories screen

- [x] 3.1 Build the categories screen (Tab Two) listing predefined + the user's own custom categories; verify the "Predefined categories available by default" scenario shows the six starter categories for a brand-new user
- [x] 3.2 Add a form to create a custom category, rejecting an empty name; verify the "Creating a custom category" and "Custom category name required" scenarios from specs/expense-tracking/spec.md

## 4. Recording expenses

- [x] 4.1 Build the add-expense form (reusing the existing `modal.tsx` route) with amount, category picker, date, and optional description; verify the "Successful expense creation" scenario creates an expense attributed to the current user
- [x] 4.2 Validate the amount and category before submitting; verify the "Invalid amount rejected" and "Missing category rejected" scenarios show the expected messages without creating an expense

## 5. Viewing, editing, and deleting expenses

- [x] 5.1 Build the expense list screen (Tab One) showing only the current user's expenses; verify the "Listing expenses" scenario by checking two different test accounts each see only their own
- [x] 5.2 Wire the modal route to also handle editing an existing expense (passed via an id param); verify the "Editing an expense" scenario updates the record with new values
- [x] 5.3 Add a delete action on an expense in the list; verify the "Deleting an expense" scenario removes it from the list and from the database
