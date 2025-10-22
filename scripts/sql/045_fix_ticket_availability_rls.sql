-- Fix ticket availability calculation by allowing public access to booking counts
-- The current RLS policy only allows users to see their own bookings, but for
-- calculating ticket availability, we need to see ALL confirmed bookings for each listing

-- Add policy to allow public access to booking data for availability calculations
CREATE POLICY "Public can view booking counts for availability"
  ON public.bookings FOR SELECT
  USING (true);

-- This policy allows anyone to read booking data, which is needed for:
-- 1. Calculating remaining tickets for each listing
-- 2. Showing consistent availability numbers to all users
-- 3. Ensuring the shop page shows accurate ticket counts

-- The existing user-specific policies still apply for:
-- - Users viewing their own booking details
-- - Users creating new bookings
-- - Vendors viewing bookings for their listings

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '✅ Added public access policy for booking availability calculations';
  RAISE NOTICE 'All users will now see consistent ticket availability numbers';
  RAISE NOTICE 'The shop page will show accurate remaining ticket counts';
END $$;
