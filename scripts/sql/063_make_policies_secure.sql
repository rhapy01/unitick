-- Make bookings policies secure while keeping it working
-- Run this AFTER confirming the order page works with the permissive policy

-- ==========================================
-- STEP 1: Drop all existing policies
-- ==========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'bookings'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.bookings';
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- ==========================================
-- STEP 2: Create secure policies
-- ==========================================

-- Users can view bookings where they are the owner
CREATE POLICY "users_view_own_bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view bookings in their orders (simple check to avoid recursion)
CREATE POLICY "users_view_order_bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Users can create their own bookings
CREATE POLICY "users_create_bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- VERIFY
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Secure policies created - users can only see their own bookings and bookings in their orders';
END $$;

