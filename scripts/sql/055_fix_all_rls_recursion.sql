-- COMPREHENSIVE FIX for RLS recursion across ALL tables
-- This fixes the infinite recursion that broke bookings, listings, vendors, cart_items, etc.

-- ==========================================
-- 1. FIX BOOKINGS
-- ==========================================
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "user_bookings_policy" ON public.bookings;
DROP POLICY IF EXISTS "Public can view booking counts for availability" ON public.bookings;
DROP POLICY IF EXISTS "users_view_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "users_create_bookings" ON public.bookings;

CREATE POLICY "users_view_own_bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_create_bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 2. FIX LISTINGS
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Vendors can view their own listings" ON public.listings;
DROP POLICY IF EXISTS "public_view_active_listings" ON public.listings;
DROP POLICY IF EXISTS "vendors_view_own_listings" ON public.listings;
DROP POLICY IF EXISTS "vendors_create_listings" ON public.listings;
DROP POLICY IF EXISTS "vendors_update_listings" ON public.listings;
DROP POLICY IF EXISTS "vendors_delete_listings" ON public.listings;
DROP POLICY IF EXISTS "Vendors can create listings" ON public.listings;
DROP POLICY IF EXISTS "Vendors can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Vendors can delete their own listings" ON public.listings;

CREATE POLICY "public_view_active_listings"
  ON public.listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "vendors_view_own_listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "vendors_create_listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "vendors_update_listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "vendors_delete_listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- 3. FIX VENDORS
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view active vendors" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can view their own data" ON public.vendors;
DROP POLICY IF EXISTS "public_view_vendors" ON public.vendors;
DROP POLICY IF EXISTS "vendors_view_own_data" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update_own_data" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can update their own data" ON public.vendors;
DROP POLICY IF EXISTS "Users can create vendor profiles" ON public.vendors;
DROP POLICY IF EXISTS "users_create_vendor_profiles" ON public.vendors;

-- Simple policy: anyone can view verified vendors
CREATE POLICY "public_view_vendors"
  ON public.vendors FOR SELECT
  USING (is_verified = true);

-- Vendors can view their own data (even if not verified)
CREATE POLICY "vendors_view_own_data"
  ON public.vendors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Vendors can update their own data
CREATE POLICY "vendors_update_own_data"
  ON public.vendors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create vendor profiles
CREATE POLICY "users_create_vendor_profiles"
  ON public.vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 4. FIX CART_ITEMS
-- ==========================================
DROP POLICY IF EXISTS "Users can view their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can add to cart" ON public.cart_items;
DROP POLICY IF EXISTS "users_view_cart" ON public.cart_items;
DROP POLICY IF EXISTS "users_add_to_cart" ON public.cart_items;
DROP POLICY IF EXISTS "users_update_cart" ON public.cart_items;
DROP POLICY IF EXISTS "users_delete_cart" ON public.cart_items;

CREATE POLICY "users_view_cart"
  ON public.cart_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_add_to_cart"
  ON public.cart_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_cart"
  ON public.cart_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_delete_cart"
  ON public.cart_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ==========================================
-- 5. FAVORITES TABLE NOT PRESENT - SKIP
-- ==========================================

-- ==========================================
-- 6. FIX UNILA_MILES (only if table exists)
-- ==========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unila_miles') THEN
    DROP POLICY IF EXISTS "Users can view their miles" ON public.unila_miles;
    DROP POLICY IF EXISTS "Users can manage miles" ON public.unila_miles;
    DROP POLICY IF EXISTS "users_view_miles" ON public.unila_miles;
    DROP POLICY IF EXISTS "users_manage_miles" ON public.unila_miles;

    CREATE POLICY "users_view_miles"
      ON public.unila_miles FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "users_manage_miles"
      ON public.unila_miles FOR ALL
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed ALL RLS policies - no more recursion';
END $$;

