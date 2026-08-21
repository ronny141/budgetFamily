-- Fixes "infinite recursion detected in policy for relation household_members"
-- from 0004_family_sharing.sql. The household_members SELECT policy queried
-- household_members from inside its own USING clause, which re-triggers the
-- same policy recursively. A security-definer function bypasses RLS on its
-- internal query, breaking the recursion.
-- Run this once in the Supabase project's SQL Editor.

create or replace function public.my_household_id(uid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.household_members where user_id = uid limit 1;
$$;

drop policy if exists "Users can read their own membership or their co-member's" on public.household_members;
create policy "Users can read their own membership or their co-member's"
  on public.household_members for select
  using (
    user_id = auth.uid()
    or household_id = public.my_household_id(auth.uid())
  );

drop policy if exists "Users can read their own household" on public.households;
create policy "Users can read their own household"
  on public.households for select
  using (id = public.my_household_id(auth.uid()));

drop policy if exists "Users can read household budgets" on public.budgets;
create policy "Users can read household budgets"
  on public.budgets for select
  using (household_id = public.my_household_id(auth.uid()));

drop policy if exists "Users can insert household budgets" on public.budgets;
create policy "Users can insert household budgets"
  on public.budgets for insert
  with check (household_id = public.my_household_id(auth.uid()));

drop policy if exists "Users can update household budgets" on public.budgets;
create policy "Users can update household budgets"
  on public.budgets for update
  using (household_id = public.my_household_id(auth.uid()))
  with check (household_id = public.my_household_id(auth.uid()));

drop policy if exists "Users can delete household budgets" on public.budgets;
create policy "Users can delete household budgets"
  on public.budgets for delete
  using (household_id = public.my_household_id(auth.uid()));
