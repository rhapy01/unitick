-- COMPLETE FIX for infinite recursion in bookings RLS policies
-- Drop ALL possible policies, then recreate them properly

-- Drop every single policy that could be causing recursion
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Vendors can view bookings for their listings" ON public.bookings;
DROP POLICY IF EXISTS "Public can view booking counts for availability" ON public.bookings;
DROP POLICY IF EXISTS "Public bookings verification access" ON public.bookings;
DROP POLICY IF EXISTS "Public booking access for confirmed orders" ON public.bookings;
DROP POLICY IF EXISTS "All users can view bookings" ON public.bookings;

-- Now create ONLY the essential policies (without recursion)

-- 1. Users can view their own bookings
CREATE POLICY "users_view_own_bookings"
  ON public.bookings FOR SELECT
  USING (user_id = auth.uid());

-- 2. Vendors can view bookings for their listings  
CREATE POLICY "vendors_view_own_listing_bookings"
  ON public.bookings FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- That's it. No "public" policies to avoid recursion.

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed bookings policies - removed recursive policies';
END $$;


