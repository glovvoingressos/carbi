-- Monthly view counts for last 6 months
CREATE OR REPLACE FUNCTION get_monthly_views()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'label', to_char(month_start, 'Mon'),
      'value', COALESCE(view_count, 0)
    ) ORDER BY month_start
  ) INTO result
  FROM (
    SELECT
      date_trunc('month', now()) - (n || ' months')::interval AS month_start,
      (SELECT count(*)::int FROM listing_views
       WHERE viewed_at >= date_trunc('month', now()) - (n || ' months')::interval
         AND viewed_at < date_trunc('month', now()) - ((n - 1) || ' months')::interval
      ) AS view_count
    FROM generate_series(0, 5) AS n
  ) sub;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
