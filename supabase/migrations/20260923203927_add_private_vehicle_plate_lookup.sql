-- License plates and FIPE identity are kept outside public listing/vehicle records.
create table if not exists public.vehicle_private_identifiers (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  plate varchar(7) not null check (plate ~ '^[A-Z0-9]{7}$'),
  brand text not null,
  model text not null,
  version text,
  year_model smallint not null check (year_model between 1950 and 2100),
  fipe_model_name text,
  fipe_code text,
  fipe_history jsonb not null default '[]'::jsonb check (jsonb_typeof(fipe_history) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicle_private_identifiers_owner
  on public.vehicle_private_identifiers (owner_user_id);

alter table public.vehicle_private_identifiers enable row level security;
revoke all on public.vehicle_private_identifiers from public, anon, authenticated;
grant all on public.vehicle_private_identifiers to service_role;

-- No client-facing policies: reads and writes are restricted to server-side service-role code.

-- Migrate only legacy rows containing a complete plate; one-character plate suffixes are ignored.
insert into public.vehicle_private_identifiers (
  vehicle_id,
  owner_user_id,
  plate,
  brand,
  model,
  version,
  year_model
)
select distinct on (l.vehicle_id)
  l.vehicle_id,
  l.user_id,
  upper(regexp_replace(l.plate_final, '[^A-Za-z0-9]', '', 'g')),
  l.brand,
  l.model,
  l.version,
  l.year_model
from public.vehicle_listings l
where l.vehicle_id is not null
  and l.plate_final ~ '^[A-Za-z0-9]{7}$'
order by l.vehicle_id, l.updated_at desc
on conflict (vehicle_id) do nothing;
-- License plates and FIPE identity are kept outside public listing and vehicle records.
create table if not exists public.vehicle_private_identifiers (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  plate varchar(7) not null check (plate ~ '^[A-Z0-9]{7}$'),
  brand text not null,
  model text not null,
  version text,
  year_model smallint not null check (year_model between 1950 and 2100),
  fipe_model_name text,
  fipe_code text,
  fipe_history jsonb not null default '[]'::jsonb check (jsonb_typeof(fipe_history) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicle_private_identifiers_owner
  on public.vehicle_private_identifiers (owner_user_id);

alter table public.vehicle_private_identifiers enable row level security;
revoke all on public.vehicle_private_identifiers from public, anon, authenticated;
grant all on public.vehicle_private_identifiers to service_role;

-- No client-facing policies: only server-side service-role code can access these rows.

-- Preserve existing full plate values privately; one-character suffixes are ignored.
insert into public.vehicle_private_identifiers (
  vehicle_id,
  owner_user_id,
  plate,
  brand,
  model,
  version,
  year_model
)
select distinct on (l.vehicle_id)
  l.vehicle_id,
  l.user_id,
  upper(regexp_replace(l.plate_final, '[^A-Za-z0-9]', '', 'g')),
  l.brand,
  l.model,
  l.version,
  l.year_model
from public.vehicle_listings l
where l.vehicle_id is not null
  and l.plate_final ~ '^[A-Za-z0-9]{7}$'
order by l.vehicle_id, l.updated_at desc
on conflict (vehicle_id) do nothing;
