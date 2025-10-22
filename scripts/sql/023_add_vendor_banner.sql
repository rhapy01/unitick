-- Add banner URL field to vendors table
-- This allows vendors to customize their profile with a header banner image

ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.vendors.banner_url IS 'URL to the vendor''s profile banner image (displayed at the top of their profile page)';

