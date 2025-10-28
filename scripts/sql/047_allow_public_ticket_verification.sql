-- Allow public ticket verification
-- This policy enables unauthenticated users to view order data
-- when scanning QR codes for ticket verification

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public ticket verification access" ON public.orders;

-- Create policy to allow public read access to confirmed orders for ticket verification
CREATE POLICY "Public ticket verification access" ON public.orders
  FOR SELECT
  USING (status = 'confirmed');

-- Also need to allow public access to order_items for verified orders
DROP POLICY IF EXISTS "Public order items verification access" ON public.order_items;

CREATE POLICY "Public order items verification access" ON public.order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE status = 'confirmed'
    )
  );

-- Allow public access to bookings for verified orders
-- This policy should be ADDITIVE, not replacing existing policies
-- Users still need to be able to view their own bookings
DROP POLICY IF EXISTS "Public bookings verification access" ON public.bookings;

CREATE POLICY "Public bookings verification access" ON public.bookings
  FOR SELECT
  USING (
    -- Allow access if booking is part of a confirmed order
    id IN (
      SELECT booking_id 
      FROM public.order_items 
      WHERE order_id IN (
        SELECT id FROM public.orders WHERE status = 'confirmed'
      )
    )
  );

-- Allow public access to listings for verified bookings
DROP POLICY IF EXISTS "Public listings verification access" ON public.listings;

CREATE POLICY "Public listings verification access" ON public.listings
  FOR SELECT
  USING (
    id IN (
      SELECT listing_id 
      FROM public.bookings 
      WHERE id IN (
        SELECT booking_id 
        FROM public.order_items 
        WHERE order_id IN (
          SELECT id FROM public.orders WHERE status = 'confirmed'
        )
      )
    )
  );

-- Allow public access to vendors for verified listings
DROP POLICY IF EXISTS "Public vendors verification access" ON public.vendors;

CREATE POLICY "Public vendors verification access" ON public.vendors
  FOR SELECT
  USING (
    id IN (
      SELECT vendor_id 
      FROM public.listings 
      WHERE id IN (
        SELECT listing_id 
        FROM public.bookings 
        WHERE id IN (
          SELECT booking_id 
          FROM public.order_items 
          WHERE order_id IN (
            SELECT id FROM public.orders WHERE status = 'confirmed'
          )
        )
      )
    )
  );

-- Allow public access to profiles for verified orders (only user_id relationship)
DROP POLICY IF EXISTS "Public profiles verification access" ON public.profiles;

CREATE POLICY "Public profiles verification access" ON public.profiles
  FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM public.orders WHERE status = 'confirmed'
    )
  );

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ Added public ticket verification access policies';
END $$;
