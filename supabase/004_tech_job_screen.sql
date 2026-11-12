-- Phase 4: the tech job screen (status, timer, checklist, before/after photos).
-- Run this in the Supabase SQL Editor the same way as 001, 002, and 003.

-- A tech can now update their own assigned jobs (to change status and the
-- started/finished timestamps from the job screen). A trigger below still
-- blocks them from changing anything else about the job (price, tip,
-- customer, address, etc.) — only an owner can change those.
create policy "jobs_update_own_tech" on jobs
  for update using (assigned_tech = auth.uid());

create or replace function protect_job_fields_from_tech()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_role() <> 'owner' then
    if new.customer_id is distinct from old.customer_id
      or new.vehicle_id is distinct from old.vehicle_id
      or new.package_id is distinct from old.package_id
      or new.assigned_tech is distinct from old.assigned_tech
      or new.scheduled_start is distinct from old.scheduled_start
      or new.scheduled_minutes is distinct from old.scheduled_minutes
      or new.address is distinct from old.address
      or new.price is distinct from old.price
      or new.tip is distinct from old.tip
      or new.payment_status is distinct from old.payment_status
    then
      raise exception 'Only an owner can change job details other than status';
    end if;
  end if;
  return new;
end;
$$;

create trigger jobs_protect_fields_from_tech
  before update on jobs
  for each row execute function protect_job_fields_from_tech();

-- Per-package checklist steps, managed by the owner on the Packages page.
create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references packages (id) on delete cascade,
  step_order integer not null,
  step_text text not null,
  created_at timestamptz not null default now()
);

alter table checklist_templates enable row level security;

create policy "checklist_templates_select_staff" on checklist_templates
  for select using (current_user_role() in ('owner', 'tech'));

create policy "checklist_templates_insert_owner" on checklist_templates
  for insert with check (current_user_role() = 'owner');

create policy "checklist_templates_update_owner" on checklist_templates
  for update using (current_user_role() = 'owner');

create policy "checklist_templates_delete_owner" on checklist_templates
  for delete using (current_user_role() = 'owner');

-- Copied from the package's checklist_templates when a job is created, so
-- editing a package's checklist later doesn't change jobs already created.
create table job_checklist_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  step_order integer not null,
  step_text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table job_checklist_items enable row level security;

create policy "job_checklist_items_select_owner" on job_checklist_items
  for select using (current_user_role() = 'owner');

create policy "job_checklist_items_select_own_tech" on job_checklist_items
  for select using (
    exists (select 1 from jobs where jobs.id = job_checklist_items.job_id and jobs.assigned_tech = auth.uid())
  );

create policy "job_checklist_items_insert_owner" on job_checklist_items
  for insert with check (current_user_role() = 'owner');

create policy "job_checklist_items_update_owner" on job_checklist_items
  for update using (current_user_role() = 'owner');

create policy "job_checklist_items_update_own_tech" on job_checklist_items
  for update using (
    exists (select 1 from jobs where jobs.id = job_checklist_items.job_id and jobs.assigned_tech = auth.uid())
  );

create policy "job_checklist_items_delete_owner" on job_checklist_items
  for delete using (current_user_role() = 'owner');

-- Before/after photos. The actual image bytes live in Supabase Storage
-- (bucket created below); this table just tracks what was uploaded, for what
-- job, by whom.
create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  kind text not null check (kind in ('before', 'after')),
  storage_path text not null,
  uploaded_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table job_photos enable row level security;

create policy "job_photos_select_owner" on job_photos
  for select using (current_user_role() = 'owner');

create policy "job_photos_select_own_tech" on job_photos
  for select using (
    exists (select 1 from jobs where jobs.id = job_photos.job_id and jobs.assigned_tech = auth.uid())
  );

create policy "job_photos_insert_owner" on job_photos
  for insert with check (current_user_role() = 'owner');

create policy "job_photos_insert_own_tech" on job_photos
  for insert with check (
    exists (select 1 from jobs where jobs.id = job_photos.job_id and jobs.assigned_tech = auth.uid())
  );

create policy "job_photos_delete_owner" on job_photos
  for delete using (current_user_role() = 'owner');

create policy "job_photos_delete_own_tech" on job_photos
  for delete using (uploaded_by = auth.uid());

-- Storage bucket for the actual photo files. Public so a customer can
-- eventually be sent a direct link to their before/after photos (Phase 8);
-- uploads and deletes are still locked down below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-photos', 'job-photos', true, 10485760, array['image/*'])
on conflict (id) do nothing;

-- Photos are uploaded to a path starting with the job id, e.g.
-- "<job id>/before/169...-abc.jpg" — these policies check that folder
-- against the jobs table to decide who may upload, list, or delete.
create policy "job_photos_storage_select_staff" on storage.objects
  for select using (
    bucket_id = 'job-photos'
    and exists (
      select 1 from jobs
      where jobs.id::text = (storage.foldername(name))[1]
        and (current_user_role() = 'owner' or jobs.assigned_tech = auth.uid())
    )
  );

create policy "job_photos_storage_insert_staff" on storage.objects
  for insert with check (
    bucket_id = 'job-photos'
    and exists (
      select 1 from jobs
      where jobs.id::text = (storage.foldername(name))[1]
        and (current_user_role() = 'owner' or jobs.assigned_tech = auth.uid())
    )
  );

create policy "job_photos_storage_delete_staff" on storage.objects
  for delete using (
    bucket_id = 'job-photos'
    and (current_user_role() = 'owner' or owner = auth.uid())
  );
