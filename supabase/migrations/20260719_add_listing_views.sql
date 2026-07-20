-- Add view_count column to vehicle_listings
ALTER TABLE vehicle_listings ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Create listing_views table for detailed analytics
CREATE TABLE IF NOT EXISTS listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES vehicle_listings(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent text
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_viewed_at ON listing_views(viewed_at);

-- RLS policies
ALTER TABLE listing_views ENABLE ROW LEVEL LEVEL;

-- Anyone can insert (track views)
CREATE POLICY "Anyone can insert listing views"
  ON listing_views FOR INSERT
  WITH CHECK (true);

-- Listing owners can read their own views
CREATE POLICY "Listing owners can read their views"
  ON listing_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_listings
      WHERE vehicle_listings.id = listing_views.listing_id
      AND vehicle_listings.user_id = auth.uid()
    )
  );

-- Function to increment view count atomically
CREATE OR REPLACE FUNCTION increment_listing_views(listing_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE vehicle_listings
  SET view_count = view_count + 1
  WHERE id = listing_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
