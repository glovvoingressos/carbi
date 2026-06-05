-- Offers/Negotiation system for vehicle marketplace
-- Migration: 20260605_offers_system.sql

-- 1. Create offers table
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.vehicle_listings(id) on delete cascade,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check(amount > 0),
  payment_method text not null check(payment_method in ('cash', 'financing', 'trade_in')),
  message text,
  status text not null default 'pending' check(status in ('pending', 'accepted', 'rejected', 'countered', 'negotiating', 'completed')),
  parent_offer_id uuid references public.offers(id) on delete set null,
  counter_amount numeric(12,2) check(counter_amount is null or counter_amount > 0),
  seller_message text,
  accepted_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_offers_listing_id on public.offers(listing_id);
create index if not exists idx_offers_buyer_user_id on public.offers(buyer_user_id);
create index if not exists idx_offers_seller_user_id on public.offers(seller_user_id);
create index if not exists idx_offers_parent_offer_id on public.offers(parent_offer_id);
create index if not exists idx_offers_status on public.offers(status);

-- Updated_at trigger
create or replace function public.trg_offers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_offers_updated_at
  before update on public.offers
  for each row
  execute function public.trg_offers_updated_at();

-- 2. Add negotiation settings to vehicle_listings
alter table public.vehicle_listings
add column if not exists accepts_offers boolean not null default true;

alter table public.vehicle_listings
add column if not exists negotiable text not null default 'open' check(negotiable in ('open', 'low', 'firm'));

alter table public.vehicle_listings
add column if not exists accepts_counter boolean not null default true;

alter table public.vehicle_listings
add column if not exists accepts_trade boolean not null default false;

-- 3. RLS Policies
alter table public.offers enable row level security;

-- Anyone can see offers related to a listing they can view (active listing)
-- Buyers see their own offers, sellers see offers on their listings
create policy "offers_select_policy" on public.offers
  for select
  using (
    buyer_user_id = auth.uid()
    or seller_user_id = auth.uid()
  );

-- Authenticated users can create offers
create policy "offers_insert_policy" on public.offers
  for insert
  with check (
    auth.uid() = buyer_user_id
    and exists (
      select 1 from public.vehicle_listings
      where id = listing_id
        and user_id != auth.uid()
        and status = 'active'
    )
  );

-- Only seller can update offer status (accept, reject, counter)
create policy "offers_update_policy" on public.offers
  for update
  using (
    seller_user_id = auth.uid()
    and status = 'pending'
  )
  with check (
    seller_user_id = auth.uid()
    and status in ('accepted', 'rejected', 'countered')
  );

-- Update policy for buyer to accept counteroffer
create policy "offers_buyer_update_policy" on public.offers
  for update
  using (
    buyer_user_id = auth.uid()
    and status = 'countered'
  )
  with check (
    buyer_user_id = auth.uid()
    and status in ('accepted', 'rejected', 'negotiating')
  );

-- 4. Update vehicle_listings_public view to include negotiation columns
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
  l.price_updated_at,
  l.vehicle_type,
  l.truck_type,
  l.load_capacity,
  l.axles,
  l.truck_body_type,
  l.accepts_offers,
  l.negotiable,
  l.accepts_counter,
  l.accepts_trade,
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
