-- add-budget-planning: income + budgets tables, RLS
-- Run this once in the Supabase project's SQL Editor (Project > SQL Editor > New query).

create table if not exists public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  currency text not null default 'COP',
  original_amount numeric(12, 2) not null check (original_amount > 0),
  exchange_rate numeric(12, 6) not null default 1 check (exchange_rate > 0),
  amount_cop numeric(12, 2) generated always as (round(original_amount * exchange_rate, 2)) stored,
  income_date date not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.income enable row level security;

create policy "Users can read their own income"
  on public.income for select
  using (user_id = auth.uid());

create policy "Users can insert their own income"
  on public.income for insert
  with check (user_id = auth.uid());

create policy "Users can update their own income"
  on public.income for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own income"
  on public.income for delete
  using (user_id = auth.uid());

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

alter table public.budgets enable row level security;

create policy "Users can read their own budgets"
  on public.budgets for select
  using (user_id = auth.uid());

create policy "Users can insert their own budgets"
  on public.budgets for insert
  with check (user_id = auth.uid());

create policy "Users can update their own budgets"
  on public.budgets for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own budgets"
  on public.budgets for delete
  using (user_id = auth.uid());
