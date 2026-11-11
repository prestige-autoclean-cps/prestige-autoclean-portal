-- Prestige Auto Clean — Phase 1: staff logins and roles.
--
-- Run this once in the Supabase SQL Editor (see README.md, "Step 2 —
-- Supabase"). Later phases add more tables in their own numbered files
-- (002_..., 003_..., etc.) so it's always clear what ran when.

create type user_role as enum ('owner', 'tech');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text,
  role user_role not null default 'tech',
  van text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Looks up the calling user's own role. SECURITY DEFINER so it can read
-- the profiles table directly without triggering RLS recursion — this is
-- the one safe way to let a policy ask "is the current user an owner?".
create or replace function current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role::text from profiles where id = auth.uid()
$$;

-- Select: you can always see your own row; owners can see everyone's.
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

create policy "profiles_select_owner_all" on profiles
  for select using (current_user_role() = 'owner');

-- Update: you can edit your own row, but only an owner can change role or
-- van assignment (enforced below, not just by hiding the field in the UI).
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

create policy "profiles_update_owner_all" on profiles
  for update using (current_user_role() = 'owner');

create or replace function protect_role_and_van_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.van is distinct from old.van)
     and current_user_role() <> 'owner' then
    raise exception 'Only an owner can change role or van assignment';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role_and_van
  before update on profiles
  for each row execute function protect_role_and_van_change();

-- Owner-only management of other staff (insert/delete). Day-to-day staff
-- creation happens in Supabase Auth (see README), which fires the trigger
-- below; this just lets an owner fix or remove a row from the app later.
create policy "profiles_insert_owner" on profiles
  for insert with check (current_user_role() = 'owner');

create policy "profiles_delete_owner" on profiles
  for delete using (current_user_role() = 'owner');

-- Every time someone is added in Supabase Auth, give them a profile row
-- automatically so they can log in. New staff default to 'tech' — Matt
-- (or the first owner account) promotes the real owner by hand once,
-- see README.md "Step 2 — Supabase".
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), 'tech');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
