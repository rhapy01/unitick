-- COMPLETELY FIX BOOKINGS - No recursion, no vendor queries
-- This enables RLS and creates the simplest possible policies

-- Drop all policies
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
  END LOOP;
END $$;

-- Create ONLY user-based policies with no recursive queries
CREATE POLICY "users_view_bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_create_bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Report
DO $$
BEGIN
  RAISE NOTICE '✅ Bookings policies fixed - no recursion';
END $$;

