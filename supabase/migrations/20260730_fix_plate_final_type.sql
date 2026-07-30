alter table public.vehicle_listings
  alter column plate_final type varchar(7) using plate_final::varchar(7);
