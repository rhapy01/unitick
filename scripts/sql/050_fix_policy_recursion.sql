-- Fix infinite recursion in bookings RLS policies
-- This happens when policies create circular references

-- STEP 1: Drop ALL existing policies on bookings to break the recursion
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Vendors can view bookings for their listings" ON public.bookings;
DROP POLICY IF EXISTS "Public can view booking counts for availability" ON public.bookings;
DROP POLICY IF EXISTS "Public bookings verification access" ON public.bookings;

-- STEP 2: Create simple, non-recursive policies
-- Allow users to see their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (user_id = auth.uid());

-- Allow vendors to see bookings for their listings  
CREATE POLICY "Vendors can view bookings for their listings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = bookings.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Allow public access for confirmed orders (QR scanning)
CREATE POLICY "Public bookings verification access"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items
      WHERE order_items.booking_id = bookings.id
      AND EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND orders.status = 'confirmed'
      )
    )
  );

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed bookings RLS policies - no more recursion';
END $$;


