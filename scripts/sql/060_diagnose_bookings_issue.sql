-- DIAGNOSTIC SCRIPT: Check bookings table structure and policies
-- Run this in Supabase SQL Editor to diagnose the issue

-- ==========================================
-- 1. CHECK TABLE STRUCTURE
-- ==========================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==========================================
-- 2. CHECK IF ORDER_ID COLUMN EXISTS
-- ==========================================
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'order_id'
  ) THEN '✅ order_id EXISTS' ELSE '❌ order_id MISSING' END as order_id_status;

-- ==========================================
-- 3. CHECK RLS POLICIES
-- ==========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;

-- ==========================================
-- 4. CHECK SAMPLE DATA
-- ==========================================
SELECT 
  COUNT(*) as total_bookings,
  COUNT(DISTINCT order_id) as bookings_with_order_id,
  COUNT(CASE WHEN order_id IS NULL THEN 1 END) as bookings_without_order_id
FROM public.bookings;

-- ==========================================
-- 5. CHECK SAMPLE ORDER-TO-BOOKINGS RELATIONSHIP
-- ==========================================
SELECT 
  o.id as order_id,
  o.user_id as order_user_id,
  oi.id as order_item_id,
  b.id as booking_id,
  b.user_id as booking_user_id,
  b.order_id as booking_order_id
FROM public.orders o
INNER JOIN public.order_items oi ON o.id = oi.order_id
INNER JOIN public.bookings b ON oi.booking_id = b.id
LIMIT 10;

-- ==========================================
-- 6. CHECK IF VENDORS TABLE POLICIES ARE CAUSING ISSUES
-- ==========================================
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('vendors', 'listings', 'bookings')
ORDER BY tablename, policyname;

-- ==========================================
-- 7. TEST QUERY THAT'S FAILING
-- ==========================================
-- This mimics what the order page does
DO $$
DECLARE
  test_order_id UUID;
  test_booking_ids UUID[];
  booking_count INTEGER;
  error_msg TEXT;
BEGIN
  -- Get a sample order
  SELECT id INTO test_order_id FROM public.orders LIMIT 1;
  
  RAISE NOTICE 'Testing with order ID: %', test_order_id;
  
  -- Get booking IDs from order_items
  SELECT ARRAY_AGG(booking_id) INTO test_booking_ids
  FROM public.order_items 
  WHERE order_id = test_order_id;
  
  RAISE NOTICE 'Found booking IDs: %', test_booking_ids;
  
  -- Try to query bookings (this is where it fails)
  BEGIN
    SELECT COUNT(*) INTO booking_count
    FROM public.bookings
    WHERE id = ANY(test_booking_ids);
    
    RAISE NOTICE '✅ Bookings query succeeded. Count: %', booking_count;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    RAISE NOTICE '❌ Bookings query failed: %', error_msg;
  END;
END $$;

-- ==========================================
-- DROP THE TEST IF IT WAS CREATED
-- ==========================================
-- No cleanup needed, we're just testing

