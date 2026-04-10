-- Marketplace production hardening
-- This migration is idempotent and can be applied safely in production.

create extension if not exists pgcrypto;

-- =====================================================================================
-- USERS PROFILE TABLE
-- =====================================================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_public_users_email on public.users (email);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

-- Backfill existing auth users
insert into public.users (id, email)
select u.id, u.email
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

alter table public.users enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users can read own profile'
  ) then
    create policy "users can read own profile"
    on public.users
    for select
    to authenticated
    using (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users can update own profile'
  ) then
    create policy "users can update own profile"
    on public.users
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);
  end if;
end $$;

-- =====================================================================================
-- VEHICLES + VEHICLE_IMAGES
-- =====================================================================================

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  listing_legacy_id uuid unique,
  brand text not null,
  model text not null,
  version text,
  year smallint not null check (year between 1950 and 2100),
  year_model smallint not null check (year_model between 1950 and 2100),
  transmission text,
  fuel text,
  color text,
  body_type text,
  engine text,
  horsepower smallint,
  doors smallint,
  mileage integer check (mileage >= 0),
  fipe_brand_code text,
  fipe_model_code text,
  fipe_year_code text,
  fipe_reference_month text,
  fipe_price numeric(12,2),
  technical_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_owner on public.vehicles (owner_user_id);
create index if not exists idx_vehicles_brand_model on public.vehicles (brand, model);
create index if not exists idx_vehicles_year_model on public.vehicles (year_model);

create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order smallint not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_vehicle_images_vehicle_sort on public.vehicle_images (vehicle_id, sort_order);

alter table public.vehicle_listings add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;
create index if not exists idx_vehicle_listings_vehicle_id on public.vehicle_listings (vehicle_id);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'vehicle_listings_status_check'
      and conrelid = 'public.vehicle_listings'::regclass
  ) then
    alter table public.vehicle_listings drop constraint vehicle_listings_status_check;
  end if;
exception when undefined_table then
  null;
end $$;

alter table public.vehicle_listings
  add constraint vehicle_listings_status_check
  check (status in ('draft', 'active', 'sold', 'archived', 'paused'));

-- Backfill vehicles for listings that do not have vehicle_id yet
insert into public.vehicles (
  owner_user_id,
  listing_legacy_id,
  brand,
  model,
  version,
  year,
  year_model,
  transmission,
  fuel,
  color,
  body_type,
  engine,
  horsepower,
  doors,
  mileage,
  fipe_brand_code,
  fipe_model_code,
  fipe_year_code,
  fipe_reference_month,
  fipe_price,
  technical_data
)
select
  l.user_id,
  l.id,
  l.brand,
  l.model,
  l.version,
  l.year,
  l.year_model,
  l.transmission,
  l.fuel,
  l.color,
  l.body_type,
  l.engine,
  l.horsepower,
  l.doors,
  l.mileage,
  l.fipe_brand_code,
  l.fipe_model_code,
  l.fipe_year_code,
  l.fipe_reference_month,
  l.fipe_price,
  l.structured_data
from public.vehicle_listings l
where l.vehicle_id is null
on conflict (listing_legacy_id) do nothing;

update public.vehicle_listings l
set vehicle_id = v.id
from public.vehicles v
where l.vehicle_id is null
  and v.listing_legacy_id = l.id;

-- Backfill vehicle_images from listing images where possible
insert into public.vehicle_images (vehicle_id, storage_path, public_url, sort_order, is_primary)
select
  l.vehicle_id,
  i.storage_path,
  i.public_url,
  i.sort_order,
  i.is_primary
from public.vehicle_listing_images i
join public.vehicle_listings l on l.id = i.listing_id
left join public.vehicle_images vi
  on vi.vehicle_id = l.vehicle_id
 and vi.storage_path = i.storage_path
where l.vehicle_id is not null
  and vi.id is null;

alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicles' and policyname = 'public read active vehicles from listings'
  ) then
    create policy "public read active vehicles from listings"
    on public.vehicles
    for select
    using (
      exists (
        select 1
        from public.vehicle_listings l
        where l.vehicle_id = vehicles.id
          and (l.status = 'active' or l.user_id = auth.uid())
      )
      or owner_user_id = auth.uid()
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicles' and policyname = 'owners insert vehicles'
  ) then
    create policy "owners insert vehicles"
    on public.vehicles
    for insert
    to authenticated
    with check (owner_user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicles' and policyname = 'owners update vehicles'
  ) then
    create policy "owners update vehicles"
    on public.vehicles
    for update
    to authenticated
    using (owner_user_id = auth.uid())
    with check (owner_user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicles' and policyname = 'owners delete vehicles'
  ) then
    create policy "owners delete vehicles"
    on public.vehicles
    for delete
    to authenticated
    using (owner_user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicle_images' and policyname = 'public read vehicle images'
  ) then
    create policy "public read vehicle images"
    on public.vehicle_images
    for select
    using (
      exists (
        select 1
        from public.vehicle_listings l
        where l.vehicle_id = vehicle_images.vehicle_id
          and (l.status = 'active' or l.user_id = auth.uid())
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicle_images' and policyname = 'owners insert vehicle images'
  ) then
    create policy "owners insert vehicle images"
    on public.vehicle_images
    for insert
    to authenticated
    with check (
      exists (
        select 1
        from public.vehicles v
        where v.id = vehicle_images.vehicle_id
          and v.owner_user_id = auth.uid()
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicle_images' and policyname = 'owners update vehicle images'
  ) then
    create policy "owners update vehicle images"
    on public.vehicle_images
    for update
    to authenticated
    using (
      exists (
        select 1
        from public.vehicles v
        where v.id = vehicle_images.vehicle_id
          and v.owner_user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.vehicles v
        where v.id = vehicle_images.vehicle_id
          and v.owner_user_id = auth.uid()
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicle_images' and policyname = 'owners delete vehicle images'
  ) then
    create policy "owners delete vehicle images"
    on public.vehicle_images
    for delete
    to authenticated
    using (
      exists (
        select 1
        from public.vehicles v
        where v.id = vehicle_images.vehicle_id
          and v.owner_user_id = auth.uid()
      )
    );
  end if;
end $$;

-- =====================================================================================
-- COMPATIBILITY MODEL FOR REQUIRED ENTITIES
-- =====================================================================================

create or replace view public.messages as
select
  id,
  conversation_id,
  sender_user_id as user_id,
  message,
  created_at
from public.conversation_messages;

-- Keep list view aligned and expose vehicle_id
create or replace view public.vehicle_listings_public as
select
  l.id,
  l.user_id,
  l.vehicle_id,
  l.title,
  l.description,
  l.brand,
  l.model,
  l.version,
  l.year,
  l.year_model,
  l.mileage,
  l.price,
  l.transmission,
  l.fuel,
  l.color,
  l.body_type,
  l.city,
  l.state,
  l.optional_items,
  l.engine,
  l.horsepower,
  l.plate_final,
  l.doors,
  l.fipe_price,
  l.fipe_difference_value,
  l.fipe_difference_percent,
  l.fipe_reference_month,
  l.status,
  l.slug,
  l.published_at,
  l.created_at,
  l.updated_at,
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', img.id,
        'url', img.public_url,
        'sort_order', img.sort_order,
        'is_primary', img.is_primary
      ) order by img.sort_order asc
    )
    from public.vehicle_listing_images img
    where img.listing_id = l.id
  ) as images
from public.vehicle_listings l
where l.status = 'active';
