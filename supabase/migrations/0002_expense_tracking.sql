-- add-expense-tracking: categories + expenses tables, RLS, and seed data
-- Run this once in the Supabase project's SQL Editor (Project > SQL Editor > New query).

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories are visible if predefined or own"
  on public.categories for select
  using (owner_id is null or owner_id = auth.uid());

create policy "Users can create their own categories"
  on public.categories for insert
  with check (owner_id = auth.uid());

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can read their own expenses"
  on public.expenses for select
  using (user_id = auth.uid());

create policy "Users can insert their own expenses"
  on public.expenses for insert
  with check (user_id = auth.uid());

create policy "Users can update their own expenses"
  on public.expenses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (user_id = auth.uid());

insert into public.categories (owner_id, name) values
  (null, 'Comida'),
  (null, 'Transporte'),
  (null, 'Entretenimiento'),
  (null, 'Servicios'),
  (null, 'Salud'),
  (null, 'Otros');
