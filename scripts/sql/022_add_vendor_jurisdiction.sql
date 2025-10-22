-- Add jurisdiction field to vendors table
-- This represents the country where the vendor operates (e.g., "NG", "UG", "US")

ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(2);

-- Add comment to explain the field
COMMENT ON COLUMN public.vendors.jurisdiction IS 'Two-letter country code (ISO 3166-1 alpha-2) representing the vendor''s jurisdiction/operating country';

-- Create an index for jurisdiction filtering
CREATE INDEX IF NOT EXISTS idx_vendors_jurisdiction ON public.vendors(jurisdiction);

