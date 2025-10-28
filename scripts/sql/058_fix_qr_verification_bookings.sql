-- FIX QR CODE VERIFICATION: Allow vendors to view bookings
-- This fixes the "No bookings found for this vendor" error when scanning QR codes
-- Safe to run alongside existing policies from 056_fix_vendors_rls_final.sql

-- ==========================================
-- DROP ANY EXISTING CONFLICTING POLICIES FIRST
-- ==========================================
DROP POLICY IF EXISTS "vendors_view_bookings_for_verification" ON public.bookings;
DROP POLICY IF EXISTS "public_view_bookings_for_confirmed_orders" ON public.bookings;
DROP POLICY IF EXISTS "Vendors can view bookings for their listings" ON public.bookings;
DROP POLICY IF EXISTS "vendors_view_own_listing_bookings" ON public.bookings;

-- ==========================================
-- ADD VENDOR ACCESS TO BOOKINGS FOR QR VERIFICATION
-- ==========================================

-- Allow vendors to view bookings for their listings (QR code verification)
CREATE POLICY "vendors_view_bookings_for_verification"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    -- Check if user is a vendor and this booking is for their listing
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Allow users to view bookings that are part of their orders (for order page)
CREATE POLICY "users_view_bookings_in_orders"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing if booking is part of user's order
    EXISTS (
      SELECT 1 FROM public.order_items
      INNER JOIN public.orders ON orders.id = order_items.order_id
      WHERE order_items.booking_id = bookings.id
      AND orders.user_id = auth.uid()
    )
  );


-- Allow public/unauthenticated access to bookings for verified orders (QR scanning)
CREATE POLICY "public_view_bookings_for_confirmed_orders"
  ON public.bookings FOR SELECT
  USING (
    -- Only allow access to bookings that are part of confirmed orders
    EXISTS (
      SELECT 1 FROM public.order_items
      INNER JOIN public.orders ON orders.id = order_items.order_id
      WHERE order_items.booking_id = bookings.id
      AND orders.status = 'confirmed'
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "vendors_view_bookings_for_verification" ON public.bookings IS 
'Allows vendors to view bookings for their listings during QR code verification';

COMMENT ON POLICY "public_view_bookings_for_confirmed_orders" ON public.bookings IS 
'Allows public QR code scanning to verify bookings in confirmed orders';

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed QR code verification - vendors can now view bookings';
END $$;

