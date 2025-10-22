-- Add categories column to vendors table
ALTER TABLE public.vendors
ADD COLUMN categories service_type[] NOT NULL DEFAULT '{}';

-- Add constraint to ensure exactly 2 categories
ALTER TABLE public.vendors
ADD CONSTRAINT vendors_categories_count CHECK (array_length(categories, 1) = 2);

-- Update RLS policy for listings to check vendor categories
DROP POLICY IF EXISTS "Vendors can create listings" ON public.listings;

CREATE POLICY "Vendors can create listings"
  ON public.listings FOR INSERT
  WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    AND service_type = ANY(
      SELECT unnest(categories) FROM public.vendors WHERE id = vendor_id
    )
  );
