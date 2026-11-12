-- Phase 3: jobs and the schedule.
-- Run this in the Supabase SQL Editor the same way as 001 and 002.

create table jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete restrict,
  vehicle_id uuid not null references vehicles (id) on delete restrict,
  package_id uuid references packages (id) on delete set null,
  assigned_tech uuid references profiles (id) on delete set null,
  scheduled_start timestamptz not null,
  scheduled_minutes integer not null default 60,
  address text not null default '',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'on_the_way', 'in_progress', 'done', 'cancelled')),
  price numeric(10, 2) not null default 0,
  tip numeric(10, 2) not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

alter table jobs enable row level security;

-- Owner sees and manages every job. A tech only ever sees jobs assigned to
-- them (tech update/insert policies come in Phase 4 with the tech job screen).
create policy "jobs_select_owner" on jobs
  for select using (current_user_role() = 'owner');

create policy "jobs_select_own_tech" on jobs
  for select using (assigned_tech = auth.uid());

create policy "jobs_insert_owner" on jobs
  for insert with check (current_user_role() = 'owner');

create policy "jobs_update_owner" on jobs
  for update using (current_user_role() = 'owner');

create policy "jobs_delete_owner" on jobs
  for delete using (current_user_role() = 'owner');

create index jobs_scheduled_start_idx on jobs (scheduled_start);
create index jobs_assigned_tech_idx on jobs (assigned_tech);
