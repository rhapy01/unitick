-- Fix bookings that should be confirmed but are showing as pending
-- This happens when the order is confirmed but bookings weren't updated

-- Update all bookings to match their order status
UPDATE bookings b
SET 
  status = o.status,
  updated_at = NOW()
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE 
  b.id = oi.booking_id
  AND o.status = 'confirmed'
  AND b.status = 'pending';

-- Report how many were fixed
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % pending bookings that had confirmed orders', fixed_count;
END $$;

-- Create a function to sync booking status with order status
CREATE OR REPLACE FUNCTION sync_booking_status_with_order()
RETURNS TABLE(bookings_updated INTEGER) AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update bookings to match their order status
  UPDATE bookings b
  SET 
    status = o.status,
    updated_at = NOW()
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE 
    b.id = oi.booking_id
    AND o.status != b.status
    AND o.status IN ('confirmed', 'cancelled');
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT updated_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sync_booking_status_with_order() TO authenticated;


