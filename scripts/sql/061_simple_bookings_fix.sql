-- SIMPLE BOOKINGS FIX - Avoid all RLS recursion
-- This temporarily disables strict RLS to diagnose the issue

-- ==========================================
-- STEP 1: Check current RLS status
-- ==========================================
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'bookings';

-- ==========================================
-- STEP 2: Drop all existing policies
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
-- STEP 3: Check if order_id column exists, if not add it
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN order_id UUID REFERENCES public.orders(id);
    RAISE NOTICE '✅ Added order_id column to bookings';
  ELSE
    RAISE NOTICE '✅ order_id column already exists';
  END IF;
END $$;

-- ==========================================
-- STEP 4: Populate order_id from order_items
-- ==========================================
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.bookings b
  SET order_id = (
    SELECT oi.order_id 
    FROM public.order_items oi 
    WHERE oi.booking_id = b.id 
    LIMIT 1
  )
  WHERE b.order_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.order_items oi WHERE oi.booking_id = b.id
  );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Populated order_id for % bookings', updated_count;
END $$;

-- ==========================================
-- STEP 5: Create simple, non-recursive policies
-- ==========================================

-- Allow authenticated users to view all bookings (TEMPORARY - for testing)
CREATE POLICY "temp_users_view_all_bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to create their own bookings
CREATE POLICY "users_create_bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Check the results
SELECT '✅ Policies created successfully' as status;

-- ==========================================
-- REPORT STATUS
-- ==========================================
DO $$
DECLARE
  bookings_count INTEGER;
  bookings_with_order_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO bookings_count FROM public.bookings;
  SELECT COUNT(*) INTO bookings_with_order_id FROM public.bookings WHERE order_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bookings Table Status:';
  RAISE NOTICE 'Total bookings: %', bookings_count;
  RAISE NOTICE 'Bookings with order_id: %', bookings_with_order_id;
  RAISE NOTICE '========================================';
END $$;

