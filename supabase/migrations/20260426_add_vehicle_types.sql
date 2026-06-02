-- Add vehicle types and truck-specific fields to vehicle marketplace
-- Migration: 20260426_add_vehicle_types.sql

-- Add vehicle_type column
alter table public.vehicle_listings
add column vehicle_type text not null default 'car' check (vehicle_type in ('car', 'truck'));

-- Add truck-specific columns
alter table public.vehicle_listings
add column truck_type text;

alter table public.vehicle_listings
add column load_capacity numeric(8,2); -- in tons

alter table public.vehicle_listings
add column axles smallint;

alter table public.vehicle_listings
add column truck_body_type text;

-- Update indexes if needed (vehicle_type is already included in status index indirectly, but add specific)
create index if not exists idx_vehicle_listings_vehicle_type on public.vehicle_listings (vehicle_type);

-- Update the set_listing_defaults function to handle vehicle_type
-- But since it's default 'car', existing listings are fine.

-- For search, we might need to update full-text search, but for now, keep it.