-- add-family-sharing: households, household_members, shared RLS, budgets re-key
-- Run this once in the Supabase project's SQL Editor (Project > SQL Editor > New query).

-- 1. Household tables -------------------------------------------------------

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade unique,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

alter table public.households enable row level security;
alter table public.household_members enable row level security;

create policy "Users can read their own household"
  on public.households for select
  using (
    id in (select household_id from public.household_members where user_id = auth.uid())
  );

create policy "Users can create a household"
  on public.households for insert
  with check (true);

-- Looking up a household by invite code (to join it) can't go through a
-- normal RLS-gated select - the caller isn't a member yet, so the "read
-- your own household" policy above would hide it. This function runs with
-- elevated privileges but only returns a match for the exact code supplied,
-- never the whole table, so it can't be used to enumerate other households.
create or replace function public.find_household_by_code(code text)
returns table (id uuid, member_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select h.id, count(hm.user_id)
  from public.households h
  left join public.household_members hm on hm.household_id = h.id
  where h.invite_code = code
  group by h.id;
$$;

create policy "Users can read their own membership or their co-member's"
  on public.household_members for select
  using (
    user_id = auth.uid()
    or household_id in (select household_id from public.household_members where user_id = auth.uid())
  );

create policy "Users can insert their own membership"
  on public.household_members for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own membership"
  on public.household_members for delete
  using (user_id = auth.uid());

-- 2. Shared household-membership function ------------------------------------

create or replace function public.household_member_ids(uid uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select uid
  union
  select hm2.user_id
  from household_members hm1
  join household_members hm2 on hm2.household_id = hm1.household_id
  where hm1.user_id = uid;
$$;

-- 3. profiles: allow household members to see each other -------------------

create policy "Users can read a household member's profile"
  on public.profiles for select
  using (id in (select household_member_ids(auth.uid())));

-- 4. categories / expenses / income: household-aware RLS -------------------

drop policy if exists "Categories are visible if predefined or own" on public.categories;
create policy "Categories are visible if predefined or shared with household"
  on public.categories for select
  using (owner_id is null or owner_id in (select household_member_ids(auth.uid())));

drop policy if exists "Users can read their own expenses" on public.expenses;
create policy "Users can read household expenses"
  on public.expenses for select
  using (user_id in (select household_member_ids(auth.uid())));

drop policy if exists "Users can update their own expenses" on public.expenses;
create policy "Users can update household expenses"
  on public.expenses for update
  using (user_id in (select household_member_ids(auth.uid())))
  with check (user_id in (select household_member_ids(auth.uid())));

drop policy if exists "Users can delete their own expenses" on public.expenses;
create policy "Users can delete household expenses"
  on public.expenses for delete
  using (user_id in (select household_member_ids(auth.uid())));

drop policy if exists "Users can read their own income" on public.income;
create policy "Users can read household income"
  on public.income for select
  using (user_id in (select household_member_ids(auth.uid())));

drop policy if exists "Users can update their own income" on public.income;
create policy "Users can update household income"
  on public.income for update
  using (user_id in (select household_member_ids(auth.uid())))
  with check (user_id in (select household_member_ids(auth.uid())));

drop policy if exists "Users can delete their own income" on public.income;
create policy "Users can delete household income"
  on public.income for delete
  using (user_id in (select household_member_ids(auth.uid())));

-- 5. budgets: re-key from user_id to household_id ---------------------------

alter table public.budgets add column if not exists household_id uuid references public.households (id);

do $$
declare
  r record;
  new_household_id uuid;
begin
  for r in select distinct user_id from public.budgets where household_id is null loop
    -- reuse an existing household for this user if they already have one
    select household_id into new_household_id
    from public.household_members
    where user_id = r.user_id
    limit 1;

    if new_household_id is null then
      insert into public.households (invite_code)
      values (substr(md5(random()::text), 1, 8))
      returning id into new_household_id;

      insert into public.household_members (household_id, user_id)
      values (new_household_id, r.user_id);
    end if;

    update public.budgets set household_id = new_household_id where user_id = r.user_id;
  end loop;
end $$;

alter table public.budgets alter column household_id set not null;
alter table public.budgets drop constraint if exists budgets_user_id_category_id_key;
alter table public.budgets drop column if exists user_id;
alter table public.budgets add constraint budgets_household_id_category_id_key unique (household_id, category_id);

drop policy if exists "Users can read their own budgets" on public.budgets;
create policy "Users can read household budgets"
  on public.budgets for select
  using (household_id in (select household_id from public.household_members where user_id = auth.uid()));

drop policy if exists "Users can insert their own budgets" on public.budgets;
create policy "Users can insert household budgets"
  on public.budgets for insert
  with check (household_id in (select household_id from public.household_members where user_id = auth.uid()));

drop policy if exists "Users can update their own budgets" on public.budgets;
create policy "Users can update household budgets"
  on public.budgets for update
  using (household_id in (select household_id from public.household_members where user_id = auth.uid()))
  with check (household_id in (select household_id from public.household_members where user_id = auth.uid()));

drop policy if exists "Users can delete their own budgets" on public.budgets;
create policy "Users can delete household budgets"
  on public.budgets for delete
  using (household_id in (select household_id from public.household_members where user_id = auth.uid()));
