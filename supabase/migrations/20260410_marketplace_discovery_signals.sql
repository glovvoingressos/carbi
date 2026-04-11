-- Marketplace discovery signals, price history and movement events
-- Idempotent migration for production.

create extension if not exists pgcrypto;

alter table public.vehicle_listings
  add column if not exists price_updated_at timestamptz not null default now();

update public.vehicle_listings
set price_updated_at = coalesce(price_updated_at, updated_at, created_at, now())
where price_updated_at is null;

create table if not exists public.vehicle_price_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.vehicle_listings(id) on delete cascade,
  vehicle_id uuid null references public.vehicles(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  old_price numeric(12,2),
  new_price numeric(12,2) not null check (new_price > 0),
  changed_at timestamptz not null default now(),
  source text not null default 'system'
);

create index if not exists idx_vehicle_price_history_listing_changed
  on public.vehicle_price_history (listing_id, changed_at desc);
create index if not exists idx_vehicle_price_history_vehicle_changed
  on public.vehicle_price_history (vehicle_id, changed_at desc);
create index if not exists idx_vehicle_price_history_changed
  on public.vehicle_price_history (changed_at desc);

create table if not exists public.vehicle_listing_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.vehicle_listings(id) on delete cascade,
  vehicle_id uuid null references public.vehicles(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  type text not null check (type in ('created', 'price_update', 'status_update', 'updated')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_vehicle_listing_events_listing_created
  on public.vehicle_listing_events (listing_id, created_at desc);
create index if not exists idx_vehicle_listing_events_type_created
  on public.vehicle_listing_events (type, created_at desc);

create or replace function public.set_listing_price_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.price is distinct from old.price then
    new.price_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vehicle_listings_price_updated_at on public.vehicle_listings;
create trigger trg_vehicle_listings_price_updated_at
before update on public.vehicle_listings
for each row
execute function public.set_listing_price_updated_at();

create or replace function public.log_vehicle_listing_movements()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.vehicle_price_history (
      listing_id,
      vehicle_id,
      user_id,
      old_price,
      new_price,
      changed_at,
      source
    ) values (
      new.id,
      new.vehicle_id,
      new.user_id,
      null,
      new.price,
      coalesce(new.published_at, new.created_at, now()),
      'created'
    );

    insert into public.vehicle_listing_events (
      listing_id,
      vehicle_id,
      user_id,
      type,
      payload,
      created_at
    ) values (
      new.id,
      new.vehicle_id,
      new.user_id,
      'created',
      jsonb_build_object('status', new.status, 'price', new.price),
      coalesce(new.published_at, new.created_at, now())
    );
  elsif tg_op = 'UPDATE' then
    if new.price is distinct from old.price then
      insert into public.vehicle_price_history (
        listing_id,
        vehicle_id,
        user_id,
        old_price,
        new_price,
        changed_at,
        source
      ) values (
        new.id,
        new.vehicle_id,
        new.user_id,
        old.price,
        new.price,
        now(),
        'price_update'
      );

      insert into public.vehicle_listing_events (
        listing_id,
        vehicle_id,
        user_id,
        type,
        payload,
        created_at
      ) values (
        new.id,
        new.vehicle_id,
        new.user_id,
        'price_update',
        jsonb_build_object('old_price', old.price, 'new_price', new.price),
        now()
      );
    end if;

    if new.status is distinct from old.status then
      insert into public.vehicle_listing_events (
        listing_id,
        vehicle_id,
        user_id,
        type,
        payload,
        created_at
      ) values (
        new.id,
        new.vehicle_id,
        new.user_id,
        'status_update',
        jsonb_build_object('old_status', old.status, 'new_status', new.status),
        now()
      );
    elsif new.updated_at is distinct from old.updated_at then
      insert into public.vehicle_listing_events (
        listing_id,
        vehicle_id,
        user_id,
        type,
        payload,
        created_at
      ) values (
        new.id,
        new.vehicle_id,
        new.user_id,
        'updated',
        '{}'::jsonb,
        now()
      );
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_log_vehicle_listing_movements on public.vehicle_listings;
create trigger trg_log_vehicle_listing_movements
after insert or update on public.vehicle_listings
for each row
execute function public.log_vehicle_listing_movements();

insert into public.vehicle_price_history (listing_id, vehicle_id, user_id, old_price, new_price, changed_at, source)
select
  l.id,
  l.vehicle_id,
  l.user_id,
  null,
  l.price,
  coalesce(l.price_updated_at, l.published_at, l.created_at, now()),
  'backfill'
from public.vehicle_listings l
left join public.vehicle_price_history h
  on h.listing_id = l.id
where h.id is null;

insert into public.vehicle_listing_events (listing_id, vehicle_id, user_id, type, payload, created_at)
select
  l.id,
  l.vehicle_id,
  l.user_id,
  'created',
  jsonb_build_object('status', l.status, 'price', l.price),
  coalesce(l.published_at, l.created_at, now())
from public.vehicle_listings l
left join public.vehicle_listing_events e
  on e.listing_id = l.id and e.type = 'created'
where e.id is null;

alter table public.vehicle_price_history enable row level security;
alter table public.vehicle_listing_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicle_price_history' and policyname = 'public read listing price history'
  ) then
    create policy "public read listing price history"
    on public.vehicle_price_history
    for select
    using (
      exists (
        select 1
        from public.vehicle_listings l
        where l.id = vehicle_price_history.listing_id
          and (l.status = 'active' or l.user_id = auth.uid())
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicle_listing_events' and policyname = 'public read listing events'
  ) then
    create policy "public read listing events"
    on public.vehicle_listing_events
    for select
    using (
      exists (
        select 1
        from public.vehicle_listings l
        where l.id = vehicle_listing_events.listing_id
          and (l.status = 'active' or l.user_id = auth.uid())
      )
    );
  end if;
end $$;

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
  ) as images,
  l.price_updated_at
from public.vehicle_listings l
where l.status = 'active';
