-- RPC: check if this ip_hash viewed this listing in the last 30 minutes
CREATE OR REPLACE FUNCTION recent_listing_view(
  p_listing_id uuid,
  p_ip_hash text,
  p_window_minutes integer DEFAULT 30
)
RETURNS boolean AS $$
DECLARE
  found_row boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM listing_views
    WHERE listing_id = p_listing_id
      AND ip_hash = p_ip_hash
      AND viewed_at > now() - (p_window_minutes || ' minutes')::interval
  ) INTO found_row;
  RETURN found_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
