-- FINAL FIX: Disable RLS on bookings to stop recursion
-- This is a temporary emergency fix

-- Disable RLS temporarily to break the recursion
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Now let's re-enable it with ONLY the most basic policy
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "users_view_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "vendors_view_own_listing_bookings" ON public.bookings;
DROP POLICY IF EXISTS "Vendors can view bookings for their listings" ON public.bookings;
DROP POLICY IF EXISTS "Public can view booking counts for availability" ON public.bookings;
DROP POLICY IF EXISTS "Public bookings verification access" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

-- Create ONLY ONE simple policy for users
CREATE POLICY "user_bookings_policy"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own bookings
CREATE POLICY "user_create_bookings_policy"  
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- That's it. No vendor or public policies to avoid recursion.

DO $$
BEGIN
  RAISE NOTICE '✅ Bookings RLS simplified - only user access enabled';
END $$;


