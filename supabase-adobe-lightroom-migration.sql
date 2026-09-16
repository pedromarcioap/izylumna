-- ==============================================================================
-- IZY LUMNA - Adobe Lightroom Cloud Integration Migration Script
-- ==============================================================================

-- 1. Create table for storing photographer OAuth credentials safely
CREATE TABLE IF NOT EXISTS public.photographer_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'adobe',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  catalog_id TEXT,
  account_email TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_photographer_integrations_user_id ON public.photographer_integrations(user_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.photographer_integrations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Photographers can only access and modify their own tokens)
CREATE POLICY "Photographers can view own integration tokens"
  ON public.photographer_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Photographers can insert own integration tokens"
  ON public.photographer_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Photographers can update own integration tokens"
  ON public.photographer_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Photographers can delete own integration tokens"
  ON public.photographer_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Extend Photos table with Adobe Asset metadata
ALTER TABLE public.photos 
  ADD COLUMN IF NOT EXISTS adobe_asset_id TEXT,
  ADD COLUMN IF NOT EXISTS adobe_rendition_url TEXT;

-- Index for fast Adobe Asset lookup
CREATE INDEX IF NOT EXISTS idx_photos_adobe_asset_id ON public.photos(adobe_asset_id);

-- 5. Extend Galleries table with Adobe Catalog & Album links
ALTER TABLE public.galleries 
  ADD COLUMN IF NOT EXISTS adobe_catalog_id TEXT,
  ADD COLUMN IF NOT EXISTS adobe_album_id TEXT;

-- 6. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_photographer_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_photographer_integrations_updated_at ON public.photographer_integrations;
CREATE TRIGGER trg_photographer_integrations_updated_at
  BEFORE UPDATE ON public.photographer_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_photographer_integrations_updated_at();
