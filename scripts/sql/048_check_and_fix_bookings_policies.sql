-- Check and restore bookings policies if needed
-- This ensures users can still view their own bookings

-- Check if the original policy exists
DO $$
BEGIN
  -- Check if the "Users can view their own bookings" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bookings' 
    AND policyname = 'Users can view their own bookings'
  ) THEN
    -- Restore the policy
    CREATE POLICY "Users can view their own bookings"
      ON public.bookings FOR SELECT
      USING (user_id = auth.uid());
    
    RAISE NOTICE '✅ Restored "Users can view their own bookings" policy';
  ELSE
    RAISE NOTICE '✅ "Users can view their own bookings" policy already exists';
  END IF;

  -- Check if "Vendors can view bookings for their listings" exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bookings' 
    AND policyname = 'Vendors can view bookings for their listings'
  ) THEN
    -- Restore the policy
    CREATE POLICY "Vendors can view bookings for their listings"
      ON public.bookings FOR SELECT
      USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));
    
    RAISE NOTICE '✅ Restored "Vendors can view bookings for their listings" policy';
  ELSE
    RAISE NOTICE '✅ "Vendors can view bookings for their listings" policy already exists';
  END IF;
END $$;

-- Report all existing policies for bookings
SELECT 
  policyname, 
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings'
ORDER BY policyname;
