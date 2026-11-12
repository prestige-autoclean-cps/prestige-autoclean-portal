-- Phase 2: customers, their vehicles, and the package menu.
-- Run this in the Supabase SQL Editor the same way as 001.

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  area text,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table customers enable row level security;

create policy "customers_select_staff" on customers
  for select using (current_user_role() in ('owner', 'tech'));

create policy "customers_insert_owner" on customers
  for insert with check (current_user_role() = 'owner');

create policy "customers_update_owner" on customers
  for update using (current_user_role() = 'owner');

create policy "customers_delete_owner" on customers
  for delete using (current_user_role() = 'owner');

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  year text,
  make text,
  model text,
  color text,
  plate_last text,
  size text not null default 'car' check (size in ('car', 'suv', 'truck_van')),
  care_notes text not null default '',
  created_at timestamptz not null default now()
);

alter table vehicles enable row level security;

create policy "vehicles_select_staff" on vehicles
  for select using (current_user_role() in ('owner', 'tech'));

create policy "vehicles_insert_owner" on vehicles
  for insert with check (current_user_role() = 'owner');

create policy "vehicles_update_owner" on vehicles
  for update using (current_user_role() = 'owner');

create policy "vehicles_delete_owner" on vehicles
  for delete using (current_user_role() = 'owner');

create table packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_car numeric(10, 2) not null default 0,
  price_suv numeric(10, 2) not null default 0,
  price_truck_van numeric(10, 2) not null default 0,
  estimated_minutes integer not null default 60,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table packages enable row level security;

create policy "packages_select_staff" on packages
  for select using (current_user_role() in ('owner', 'tech'));

create policy "packages_insert_owner" on packages
  for insert with check (current_user_role() = 'owner');

create policy "packages_update_owner" on packages
  for update using (current_user_role() = 'owner');

create policy "packages_delete_owner" on packages
  for delete using (current_user_role() = 'owner');

-- Placeholder packages so the Packages page isn't empty. Matt: once the
-- Prestige owner confirms the real menu (PRESTIGE_BUILD_BRIEF.md, question 1
-- under "Questions for Matt to confirm"), update these on the Packages page
-- after logging in as the owner — no SQL needed for that part.
insert into packages (name, description, price_car, price_suv, price_truck_van, estimated_minutes) values
  ('Maintenance Wash', 'Placeholder — replace with the real description.', 45, 55, 65, 45),
  ('Interior Deep Clean', 'Placeholder — replace with the real description.', 120, 140, 160, 120),
  ('Full Detail', 'Placeholder — replace with the real description.', 180, 210, 240, 180),
  ('Ceramic Coating', 'Placeholder — replace with the real description.', 450, 500, 550, 300);
