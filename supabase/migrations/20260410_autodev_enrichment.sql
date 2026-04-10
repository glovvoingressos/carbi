-- Auto.dev enrichment integration (production-safe, idempotent)

create extension if not exists pgcrypto;

alter table if exists public.vehicles
  add column if not exists vin text;

alter table if exists public.vehicles
  add column if not exists trim text;

alter table if exists public.vehicle_listings
  add column if not exists vin text;

update public.vehicles
set trim = coalesce(trim, version)
where trim is null;

create unique index if not exists vehicles_vin_uidx
on public.vehicles(vin)
where vin is not null;

create index if not exists vehicle_listings_vin_idx
on public.vehicle_listings(vin);

create table if not exists public.vehicle_enrichments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  source text not null default 'auto_dev',
  vin text null,
  identity jsonb not null default '{}'::jsonb,
  powertrain jsonb not null default '{}'::jsonb,
  efficiency jsonb not null default '{}'::jsonb,
  dimensions jsonb not null default '{}'::jsonb,
  appearance jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  photos jsonb not null default '{}'::jsonb,
  recalls jsonb not null default '{}'::jsonb,
  raw jsonb null,
  fetch_status text not null default 'success',
  fetch_error text null,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vehicle_enrichments_vehicle_source_uidx
on public.vehicle_enrichments(vehicle_id, source);

create index if not exists vehicle_enrichments_vehicle_id_idx
on public.vehicle_enrichments(vehicle_id);

create index if not exists vehicle_enrichments_vin_idx
on public.vehicle_enrichments(vin);

create table if not exists public.vehicle_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  provider text not null,
  job_type text not null,
  status text not null,
  requested_by uuid null,
  started_at timestamptz null,
  finished_at timestamptz null,
  error_message text null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_sync_jobs_vehicle_id_idx
on public.vehicle_sync_jobs(vehicle_id);

create index if not exists vehicle_sync_jobs_created_at_idx
on public.vehicle_sync_jobs(created_at desc);

create or replace function public.set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vehicle_enrichments_updated_at on public.vehicle_enrichments;
create trigger trg_vehicle_enrichments_updated_at
before update on public.vehicle_enrichments
for each row
execute function public.set_timestamp_updated_at();

alter table public.vehicle_enrichments enable row level security;
alter table public.vehicle_sync_jobs enable row level security;

-- Public can read enrichments only when linked listing is active.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vehicle_enrichments'
      and policyname = 'public read enrichments from active listings'
  ) then
    create policy "public read enrichments from active listings"
    on public.vehicle_enrichments
    for select
    using (
      exists (
        select 1
        from public.vehicle_listings l
        where l.vehicle_id = vehicle_enrichments.vehicle_id
          and (l.status = 'active' or l.user_id = auth.uid())
      )
    );
  end if;
end $$;

-- Owners manage own enrichments.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vehicle_enrichments'
      and policyname = 'owners manage own enrichments'
  ) then
    create policy "owners manage own enrichments"
    on public.vehicle_enrichments
    for all
    to authenticated
    using (
      exists (
        select 1
        from public.vehicles v
        where v.id = vehicle_enrichments.vehicle_id
          and v.owner_user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.vehicles v
        where v.id = vehicle_enrichments.vehicle_id
          and v.owner_user_id = auth.uid()
      )
    );
  end if;
end $$;

-- Owners can read/create job history for own vehicles.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vehicle_sync_jobs'
      and policyname = 'owners manage own sync jobs'
  ) then
    create policy "owners manage own sync jobs"
    on public.vehicle_sync_jobs
    for all
    to authenticated
    using (
      exists (
        select 1
        from public.vehicles v
        where v.id = vehicle_sync_jobs.vehicle_id
          and v.owner_user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.vehicles v
        where v.id = vehicle_sync_jobs.vehicle_id
          and v.owner_user_id = auth.uid()
      )
    );
  end if;
end $$;
