-- Add category_specific_data column to listings table
-- This will store JSON data specific to each service category

BEGIN;

-- Add the new column to store category-specific form data
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS category_specific_data JSONB DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN public.listings.category_specific_data IS 'Stores category-specific form data as JSON. Examples: accommodation (room types, check-in times), cinema (showtimes, age rating), tour (pickup location, guide languages), etc.';

-- Create an index on the JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_category_specific_data 
ON public.listings USING GIN (category_specific_data);

-- Update existing listings to have empty JSON object instead of NULL
UPDATE public.listings 
SET category_specific_data = '{}' 
WHERE category_specific_data IS NULL;

-- Make the column NOT NULL with default
ALTER TABLE public.listings 
ALTER COLUMN category_specific_data SET NOT NULL;

COMMIT;
