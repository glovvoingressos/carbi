-- Aggregate stats for the homepage
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_listings', (
      SELECT count(*)::int FROM vehicle_listings WHERE status = 'active'
    ),
    'total_views', (
      SELECT COALESCE(sum(view_count), 0)::int FROM vehicle_listings
    ),
    'total_listings', (
      SELECT count(*)::int FROM vehicle_listings
    ),
    'new_listings_this_month', (
      SELECT count(*)::int FROM vehicle_listing_events
      WHERE type = 'created'
        AND created_at >= date_trunc('month', now())
    ),
    'new_listings_last_month', (
      SELECT count(*)::int FROM vehicle_listing_events
      WHERE type = 'created'
        AND created_at >= date_trunc('month', now() - interval '1 month')
        AND created_at < date_trunc('month', now())
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
