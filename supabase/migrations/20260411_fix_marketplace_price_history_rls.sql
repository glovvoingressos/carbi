-- Fix RLS for marketplace movement triggers.
-- Listing creation/update triggers write to price history and event tables.
-- Owners must be allowed to insert rows generated from their own listings.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vehicle_price_history'
      and policyname = 'owners insert own listing price history'
  ) then
    create policy "owners insert own listing price history"
    on public.vehicle_price_history
    for insert
    with check (
      exists (
        select 1
        from public.vehicle_listings l
        where l.id = vehicle_price_history.listing_id
          and l.user_id = auth.uid()
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vehicle_listing_events'
      and policyname = 'owners insert own listing events'
  ) then
    create policy "owners insert own listing events"
    on public.vehicle_listing_events
    for insert
    with check (
      exists (
        select 1
        from public.vehicle_listings l
        where l.id = vehicle_listing_events.listing_id
          and l.user_id = auth.uid()
      )
    );
  end if;
end $$;
