-- Phase 5 follow-up: real bookable time slots on the public booking page,
-- based on business hours the owner sets and a 1-hour buffer between jobs.
-- Run this in the Supabase SQL Editor the same way as 001-005.

create table business_hours (
  weekday integer primary key check (weekday between 0 and 6), -- 0 = Sunday ... 6 = Saturday
  is_open boolean not null default true,
  open_time time not null default '08:00',
  close_time time not null default '18:00'
);

alter table business_hours enable row level security;

-- The booking page needs to read these without anyone logged in.
create policy "business_hours_select_public" on business_hours
  for select using (true);

create policy "business_hours_insert_owner" on business_hours
  for insert with check (current_user_role() = 'owner');

create policy "business_hours_update_owner" on business_hours
  for update using (current_user_role() = 'owner');

create policy "business_hours_delete_owner" on business_hours
  for delete using (current_user_role() = 'owner');

-- Sensible starting defaults — change these on the Availability page.
insert into business_hours (weekday, is_open, open_time, close_time) values
  (0, false, '08:00', '18:00'),
  (1, true, '08:00', '18:00'),
  (2, true, '08:00', '18:00'),
  (3, true, '08:00', '18:00'),
  (4, true, '08:00', '18:00'),
  (5, true, '08:00', '18:00'),
  (6, true, '09:00', '15:00');

-- Lets the public booking page find which times are already taken on a
-- given day, without exposing anything else about those jobs (customer,
-- price, address, etc.) to someone who isn't logged in.
create or replace function get_busy_intervals(for_day date)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select scheduled_start, scheduled_start + (scheduled_minutes || ' minutes')::interval
  from jobs
  where scheduled_start::date = for_day
    and status <> 'cancelled'
$$;

grant execute on function get_busy_intervals(date) to anon, authenticated;

-- Booking requests now capture an exact requested time slot instead of a
-- vague morning/afternoon window.
alter table booking_requests drop column requested_window;
alter table booking_requests drop column suggested_window;
alter table booking_requests add column requested_time time not null default '09:00';
alter table booking_requests add column suggested_time time;
alter table booking_requests alter column requested_time drop default;
