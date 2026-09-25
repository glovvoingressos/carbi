-- Keep the public view's column contract while never exposing license plates.
-- Existing private records remain unchanged; only the public projection is redacted.
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
  null::varchar(7) as plate_final,
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
