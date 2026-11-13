-- Phase 5: the public booking page and booking requests.
-- Run this in the Supabase SQL Editor the same way as 001-004.

-- The public booking page needs to show active packages and their prices
-- without anyone being logged in. This adds that on top of the existing
-- staff-only policy from Phase 2 (it doesn't replace it).
create policy "packages_select_public_active" on packages
  for select using (active = true);

create table booking_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  vehicle_size text not null check (vehicle_size in ('car', 'suv', 'truck_van')),
  package_id uuid references packages (id) on delete set null,
  requested_day date not null,
  requested_window text not null check (requested_window in ('morning', 'afternoon')),
  address text not null,
  area text,
  has_water_and_power boolean not null default false,
  notes text not null default '',
  status text not null default 'new'
    check (status in ('new', 'accepted', 'declined', 'rescheduled')),
  suggested_day date,
  suggested_window text check (suggested_window in ('morning', 'afternoon')),
  owner_note text,
  job_id uuid references jobs (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table booking_requests enable row level security;

-- Anyone (no login) can submit a request from the public booking page.
create policy "booking_requests_insert_public" on booking_requests
  for insert with check (true);

-- Only the owner can see or manage the requests that come in.
create policy "booking_requests_select_owner" on booking_requests
  for select using (current_user_role() = 'owner');

create policy "booking_requests_update_owner" on booking_requests
  for update using (current_user_role() = 'owner');

create policy "booking_requests_delete_owner" on booking_requests
  for delete using (current_user_role() = 'owner');
