-- Fix disappeared bookings issue
-- Ensure users can view their own bookings

-- 1. Check and restore "Users can view their own bookings" policy
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (user_id = auth.uid());

-- 2. Check and restore "Vendors can view bookings for their listings" policy  
DROP POLICY IF EXISTS "Vendors can view bookings for their listings" ON public.bookings;

CREATE POLICY "Vendors can view bookings for their listings"
  ON public.bookings FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- 3. The public verification policy should already exist
-- This allows public access to bookings in confirmed orders (for QR scanning)

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ Restored bookings policies - users can now view their own bookings';
END $$;
