alter table public.vehicle_private_identifiers
  add column if not exists fipe_last_refresh_attempt_at timestamptz,
  add column if not exists fipe_next_refresh_at timestamptz not null default now(),
  add column if not exists fipe_refresh_attempt_count smallint not null default 0
    check (fipe_refresh_attempt_count between 0 and 5),
  add column if not exists fipe_refresh_attempt_month text;

create index if not exists idx_private_vehicle_fipe_next_refresh
  on public.vehicle_private_identifiers (fipe_next_refresh_at);
