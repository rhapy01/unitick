-- Add vendor verification and marketing fields
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS physical_address TEXT,
ADD COLUMN IF NOT EXISTS business_registration_number TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing vendors to use business_name as company_name if not set
UPDATE public.vendors SET company_name = business_name WHERE company_name IS NULL;

-- Add index for featured vendors
CREATE INDEX IF NOT EXISTS idx_vendors_featured ON public.vendors(is_featured) WHERE is_featured = true AND is_verified = true;
