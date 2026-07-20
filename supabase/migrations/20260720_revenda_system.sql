-- =============================================
-- Revenda System: Fase 1+2+3
-- =============================================

-- 1. Add account_type and revenda fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'pf' CHECK (account_type IN ('pf', 'revenda'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_description text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_city text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_state text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_website text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_instagram text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_whatsapp text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_logo_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_cover_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- 2. Add featured and bulk fields to vehicle_listings
ALTER TABLE vehicle_listings ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE vehicle_listings ADD COLUMN IF NOT EXISTS featured_until timestamptz;
ALTER TABLE vehicle_listings ADD COLUMN IF NOT EXISTS dealer_notes text;
ALTER TABLE vehicle_listings ADD COLUMN IF NOT EXISTS original_import_id text;

-- 3. Import jobs table
CREATE TABLE IF NOT EXISTS import_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows integer DEFAULT 0,
  processed_rows integer DEFAULT 0,
  success_rows integer DEFAULT 0,
  error_rows integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  mapping jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 4. Import rows table (individual vehicle imports)
CREATE TABLE IF NOT EXISTS import_rows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  data jsonb NOT NULL,
  listing_id uuid REFERENCES vehicle_listings(id),
  error text,
  created_at timestamptz DEFAULT now()
);

-- 5. Revenda slug index
CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_listings_featured ON vehicle_listings(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_import_jobs_user ON import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_job ON import_rows(job_id);

-- 6. RLS policies
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_rows ENABLE ROW LEVEL SECURITY;

-- Users can read their own import jobs
CREATE POLICY "import_jobs_own" ON import_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Users can read their own import rows
CREATE POLICY "import_rows_own" ON import_rows
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM import_jobs WHERE import_jobs.id = import_rows.job_id AND import_jobs.user_id = auth.uid())
  );

-- Users can insert their own import rows
CREATE POLICY "import_rows_insert_own" ON import_rows
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM import_jobs WHERE import_jobs.id = import_rows.job_id AND import_jobs.user_id = auth.uid())
  );

-- Users can update their own import rows
CREATE POLICY "import_rows_update_own" ON import_rows
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM import_jobs WHERE import_jobs.id = import_rows.job_id AND import_jobs.user_id = auth.uid())
  );

-- Public read for revenda profiles
CREATE POLICY "public_revenda_profile" ON users
  FOR SELECT USING (account_type = 'revenda');
