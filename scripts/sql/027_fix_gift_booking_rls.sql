-- Fix RLS policy for gift bookings
-- Allow users to create bookings for gift recipients

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

-- Create new policy that allows gift bookings
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT
  WITH CHECK (
    -- Allow regular bookings where user_id matches current user
    user_id = auth.uid() 
    OR 
    -- Allow gift bookings (is_gift = true) regardless of user_id
    is_gift = true
  );

-- Add comment to explain the policy
COMMENT ON POLICY "Users can create bookings" ON public.bookings IS 
'Allows users to create their own bookings and gift bookings for recipients';
