-- Fix listings RLS to allow public viewing of active listings
-- Ensure listings can be viewed by anyone (for shop page)

-- Drop and recreate listings policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Vendors can view their own listings" ON public.listings;
DROP POLICY IF EXISTS "Vendors can create listings" ON public.listings;
DROP POLICY IF EXISTS "Vendors can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Vendors can delete their own listings" ON public.listings;

-- Allow anyone to view active listings
CREATE POLICY "public_view_active_listings"
  ON public.listings FOR SELECT
  USING (is_active = true);

-- Allow vendors to view their own listings (even inactive)
CREATE POLICY "vendors_view_own_listings"
  ON public.listings FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Allow vendors to create listings
CREATE POLICY "vendors_create_listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Allow vendors to update their own listings
CREATE POLICY "vendors_update_listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Allow vendors to delete their own listings
CREATE POLICY "vendors_delete_listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed listings RLS policies';
END $$;


