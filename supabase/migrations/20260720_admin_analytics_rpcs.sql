-- Admin: top listings by views
CREATE OR REPLACE FUNCTION get_top_listings_by_views(p_limit integer DEFAULT 10)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', vl.id,
      'title', vl.title,
      'brand', vl.brand,
      'model', vl.model,
      'view_count', vl.view_count,
      'status', vl.status,
      'created_at', vl.created_at
    ) ORDER BY vl.view_count DESC
  ) INTO result
  FROM vehicle_listings vl
  WHERE vl.view_count > 0
  LIMIT p_limit;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: views by day (last 30 days)
CREATE OR REPLACE FUNCTION get_views_by_day(p_days integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', to_char(day, 'YYYY-MM-DD'),
      'views', COALESCE(day_views, 0)
    ) ORDER BY day
  ) INTO result
  FROM (
    SELECT
      d.day::date,
      (SELECT count(*)::int FROM listing_views
       WHERE viewed_at::date = d.day::date
      ) AS day_views
    FROM generate_series(now() - (p_days || ' days')::interval, now(), '1 day') AS d(day)
  ) sub;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: summary stats
CREATE OR REPLACE FUNCTION get_admin_summary()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_listings', (SELECT count(*)::int FROM vehicle_listings),
    'active_listings', (SELECT count(*)::int FROM vehicle_listings WHERE status = 'active'),
    'total_views', (SELECT COALESCE(sum(view_count), 0)::int FROM vehicle_listings),
    'unique_viewers_30d', (
      SELECT count(DISTINCT ip_hash)::int FROM listing_views
      WHERE viewed_at > now() - interval '30 days'
    ),
    'total_users', (SELECT count(*)::int FROM auth.users),
    'listings_created_7d', (
      SELECT count(*)::int FROM vehicle_listing_events
      WHERE type = 'created' AND created_at > now() - interval '7 days'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
