-- Fix RLS policies to allow Edge Functions (service role) to update orders and bookings
-- This is needed for the verify-payment Edge Function to work properly

-- Add service role policies for orders table
CREATE POLICY "Allow service role to manage orders" ON public.orders
  FOR ALL TO service_role
  USING (true);

-- Add service role policies for bookings table  
CREATE POLICY "Allow service role to manage bookings" ON public.bookings
  FOR ALL TO service_role
  USING (true);

-- Add service role policies for order_items table
CREATE POLICY "Allow service role to manage order_items" ON public.order_items
  FOR ALL TO service_role
  USING (true);

-- Add service role policies for cart_items table (needed for clearing cart)
CREATE POLICY "Allow service role to manage cart_items" ON public.cart_items
  FOR ALL TO service_role
  USING (true);

-- Add service role policies for notifications table (needed for vendor notifications)
CREATE POLICY "Allow service role to manage notifications" ON public.notifications
  FOR ALL TO service_role
  USING (true);

-- Add service role policies for profiles table (needed for user info in notifications)
CREATE POLICY "Allow service role to read profiles" ON public.profiles
  FOR SELECT TO service_role
  USING (true);

-- Add service role policies for vendors table (needed for vendor info in notifications)
CREATE POLICY "Allow service role to read vendors" ON public.vendors
  FOR SELECT TO service_role
  USING (true);

-- Add service role policies for listings table (needed for listing info in notifications)
CREATE POLICY "Allow service role to read listings" ON public.listings
  FOR SELECT TO service_role
  USING (true);

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ Added service role RLS policies for Edge Functions';
  RAISE NOTICE 'Edge Functions can now update orders, bookings, order_items, cart_items, and notifications';
  RAISE NOTICE 'Edge Functions can now read profiles, vendors, and listings for notifications';
END $$;
