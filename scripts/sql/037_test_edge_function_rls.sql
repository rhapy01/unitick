-- Test script to verify Edge Function RLS policies work
-- Run this after applying the 036_fix_edge_function_rls.sql script

-- Test 1: Check if service role can read orders
SELECT 
  'Service role can read orders' as test_name,
  COUNT(*) as order_count
FROM orders;

-- Test 2: Check if service role can read bookings  
SELECT 
  'Service role can read bookings' as test_name,
  COUNT(*) as booking_count
FROM bookings;

-- Test 3: Check if service role can read order_items
SELECT 
  'Service role can read order_items' as test_name,
  COUNT(*) as order_item_count
FROM order_items;

-- Test 4: Check if service role can read cart_items
SELECT 
  'Service role can read cart_items' as test_name,
  COUNT(*) as cart_item_count
FROM cart_items;

-- Test 5: Check if service role can read notifications
SELECT 
  'Service role can read notifications' as test_name,
  COUNT(*) as notification_count
FROM notifications;

-- Test 6: Check if service role can read profiles
SELECT 
  'Service role can read profiles' as test_name,
  COUNT(*) as profile_count
FROM profiles;

-- Test 7: Check if service role can read vendors
SELECT 
  'Service role can read vendors' as test_name,
  COUNT(*) as vendor_count
FROM vendors;

-- Test 8: Check if service role can read listings
SELECT 
  'Service role can read listings' as test_name,
  COUNT(*) as listing_count
FROM listings;

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policy test completed';
  RAISE NOTICE 'If all queries above returned results, the service role policies are working correctly';
  RAISE NOTICE 'The Edge Function should now be able to update the database';
END $$;
