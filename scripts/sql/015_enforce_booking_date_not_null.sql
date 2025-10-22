-- Backfill missing booking_date and enforce NOT NULL constraint
-- 1) Backfill: use created_at as a reasonable fallback when booking_date is NULL
UPDATE public.bookings
SET booking_date = COALESCE(booking_date, created_at)
WHERE booking_date IS NULL;

-- 2) Enforce NOT NULL at the schema level
ALTER TABLE public.bookings
ALTER COLUMN booking_date SET NOT NULL;

-- Optional: add a simple sanity check to prevent clearly invalid dates in the far past
-- (commented out by default; enable if desired)
-- ALTER TABLE public.bookings
--   ADD CONSTRAINT bookings_booking_date_reasonable
--   CHECK (booking_date > TIMESTAMPTZ '2000-01-01');


