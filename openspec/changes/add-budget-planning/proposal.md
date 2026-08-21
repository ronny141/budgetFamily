## Why

`add-expense-tracking` lets a user record what they spend, but budgetFamily can't yet answer the core question of a budget app: "am I within budget?" This change adds income tracking and a per-category monthly budget, so the user can compare what they planned to spend against what they actually spent — the foundation for the later `add-dashboard` summary view.

## What Changes

- Add income entries: amount, currency, date, and an optional description, attributed to the user who recorded them.
- Add multi-currency income: an entry can be recorded in a currency other than the app's base currency (Colombian pesos, COP), converted to COP using a manually-entered exchange rate so every total stays comparable in one currency.
- Add a monthly budget limit per category, reused from `add-expense-tracking`'s category list.
- Add a way to see, for the current calendar month, total income (in COP), and per-category spend vs. budget.

## Capabilities

### New Capabilities
- `budget-planning`: recording income, setting a per-category monthly budget limit, and viewing spend-vs-budget for the current month.

### Modified Capabilities
(none)

## Impact

- New screen: a monthly overview (spend vs. budget per category, total income) plus an income list/entry form.
- New database tables (`income`, `budgets`), following the same per-user RLS pattern as `expenses`/`profiles`.
- Depends on categories from `add-expense-tracking` (a budget limit is set per existing category) and expenses (to compute actual spend).
- Out of scope: sharing budgets/income with another household member (`add-family-sharing`); the cross-capability summary dashboard (`add-dashboard`, which will build on this change's data); multi-currency expenses or budgets (only income supports a non-COP currency here); and live/automatic exchange rates (entered manually).
