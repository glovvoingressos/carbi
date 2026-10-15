-- Keep extreme car prices out of public inventory and place active records in the
-- existing paused state so the seller can correct them. Trucks are not compared
-- with passenger-car FIPE values.
begin;

update public.vehicle_listings
set status = 'paused',
    published_at = null,
    updated_at = now()
where status = 'active'
  and coalesce(vehicle_type, 'car') <> 'truck'
  and price > 0
  and fipe_price > 0
  and (price > fipe_price * 5 or price < fipe_price * 0.2);

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
where l.status = 'active'
  and (
    coalesce(l.vehicle_type, 'car') = 'truck'
    or l.fipe_price is null
    or l.fipe_price <= 0
    or (l.price >= l.fipe_price * 0.2 and l.price <= l.fipe_price * 5)
  );

commit;
