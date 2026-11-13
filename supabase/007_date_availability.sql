-- Phase 5 follow-up: per-date availability instead of a repeating weekly
-- pattern. Prestige's schedule doesn't follow a weekly pattern — some days
-- are wide open, others are fully blacked out, and it changes week to
-- week — so the owner sets each specific date instead of "every Monday".
-- Run this in the Supabase SQL Editor the same way as 001-006.

drop policy if exists "business_hours_select_public" on business_hours;
drop policy if exists "business_hours_insert_owner" on business_hours;
drop policy if exists "business_hours_update_owner" on business_hours;
drop policy if exists "business_hours_delete_owner" on business_hours;
drop table if exists business_hours;

create table date_availability (
  date date primary key,
  is_open boolean not null default true,
  open_time time,
  close_time time,
  created_at timestamptz not null default now(),
  check (not is_open or (open_time is not null and close_time is not null and close_time > open_time))
);

alter table date_availability enable row level security;

-- The public booking page needs to read this without anyone logged in.
create policy "date_availability_select_public" on date_availability
  for select using (true);

create policy "date_availability_insert_owner" on date_availability
  for insert with check (current_user_role() = 'owner');

create policy "date_availability_update_owner" on date_availability
  for update using (current_user_role() = 'owner');

create policy "date_availability_delete_owner" on date_availability
  for delete using (current_user_role() = 'owner');

-- A date with no row here is treated as not bookable (closed) until the
-- owner explicitly opens it on the Availability page.
