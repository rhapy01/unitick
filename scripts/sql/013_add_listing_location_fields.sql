-- Add optional map and coordinates to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS map_url TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Optional index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_listings_lat_long ON public.listings(latitude, longitude);

