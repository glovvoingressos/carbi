alter table public.vehicle_listings
  add column if not exists cabin_type text,
  add column if not exists pbt numeric(10,2),
  add column if not exists cmt numeric(10,2),
  add column if not exists truck_category text,
  add column if not exists structured_data jsonb not null default '{}'::jsonb;

alter table public.vehicle_listings
  drop constraint if exists vehicle_listings_vehicle_type_check;

alter table public.vehicle_listings
  add constraint vehicle_listings_vehicle_type_check
  check (vehicle_type in ('car', 'truck'));

alter table public.vehicle_listings
  drop constraint if exists vehicle_listings_truck_numeric_check;

alter table public.vehicle_listings
  add constraint vehicle_listings_truck_numeric_check
  check (
    (load_capacity is null or load_capacity >= 0)
    and (axles is null or axles >= 0)
    and (pbt is null or pbt >= 0)
    and (cmt is null or cmt >= 0)
  );
