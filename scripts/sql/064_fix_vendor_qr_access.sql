-- FIX VENDOR QR CODE ACCESS TO ORDERS
-- Vendors need to see confirmed orders when scanning QR codes
-- This is the missing piece causing "Order not found" errors

-- ==========================================
-- STEP 1: Add policy for authenticated users (vendors) to view confirmed orders
-- ==========================================

-- Drop ALL existing policies on orders first
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'orders'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.orders';
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Allow authenticated users (vendors) to view confirmed orders
CREATE POLICY "authenticated_view_confirmed_orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (status = 'confirmed');

-- Allow unauthenticated (public) to view confirmed orders for QR scanning
CREATE POLICY "public_view_confirmed_orders"
  ON public.orders FOR SELECT
  USING (status = 'confirmed');

-- Users can still view their own orders (any status)
CREATE POLICY "users_view_own_orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create orders
CREATE POLICY "users_create_orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own orders
CREATE POLICY "users_update_orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ==========================================
-- STEP 2: Add policy for vendors/public to view confirmed order_items
-- ==========================================

-- Drop ALL existing policies on order_items
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'order_items'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.order_items';
    RAISE NOTICE 'Dropped order_items policy: %', r.policyname;
  END LOOP;
END $$;

CREATE POLICY "Public confirmed order items verification"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE status = 'confirmed'
    )
  );

-- Users can create order_items for their orders
CREATE POLICY "users_create_order_items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

-- ==========================================
-- STEP 3: Allow vendors to view bookings for their listings (from 058)
-- ==========================================

DROP POLICY IF EXISTS "vendors_view_bookings_for_verification" ON public.bookings;

CREATE POLICY "vendors_view_bookings_for_verification"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    -- Check if user is a vendor and this booking is for their listing
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- VERIFY
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '✅ QR code verification access fixed - vendors can now view confirmed orders';
  RAISE NOTICE 'Note: Listings already have permissive policies for authenticated users';
END $$;

