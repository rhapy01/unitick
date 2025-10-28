-- FIX BOOKINGS ACCESS FOR ORDER PAGE
-- This fixes the "Error fetching bookings: {}" error on the order page
-- The recursion happens because bookings -> listings -> vendors triggers RLS checks
-- Solution: Add order_id to bookings and make policy check only orders table

-- ==========================================
-- STEP 1: ADD ORDER_ID TO BOOKINGS
-- ==========================================
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);

-- ==========================================
-- STEP 2: POPULATE ORDER_ID FROM ORDER_ITEMS
-- ==========================================
UPDATE public.bookings b
SET order_id = oi.order_id
FROM public.order_items oi
WHERE oi.booking_id = b.id
AND b.order_id IS NULL;

-- ==========================================
-- STEP 3: DROP EXISTING POLICIES
-- ==========================================
DROP POLICY IF EXISTS "users_view_bookings_in_orders" ON public.bookings;
DROP POLICY IF EXISTS "users_view_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "users_manage_bookings" ON public.bookings;
DROP POLICY IF EXISTS "user_bookings_policy" ON public.bookings;
DROP POLICY IF EXISTS "users_create_bookings" ON public.bookings;
DROP POLICY IF EXISTS "users_create_bookings_policy" ON public.bookings;
DROP POLICY IF EXISTS "user_create_bookings_policy" ON public.bookings;

-- ==========================================
-- STEP 4: CREATE SIMPLE POLICIES WITHOUT RECURSION
-- ==========================================

-- Users can view their own bookings
CREATE POLICY "users_view_own_bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view bookings in their orders (avoids recursion by checking orders directly)
CREATE POLICY "users_view_own_order_bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Users can create bookings
CREATE POLICY "users_create_bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed bookings access - added order_id and policies';
END $$;

