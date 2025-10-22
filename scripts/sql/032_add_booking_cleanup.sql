-- Script to clean up abandoned pending bookings
-- Bookings that have been pending for more than 24 hours are likely abandoned

-- Add a function to mark old pending bookings as cancelled
CREATE OR REPLACE FUNCTION cleanup_abandoned_bookings()
RETURNS void AS $$
BEGIN
  -- Update pending bookings older than 24 hours to 'cancelled'
  UPDATE bookings
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE 
    status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';
    
  -- Also update corresponding orders
  UPDATE orders
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE 
    status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Add a function to cancel specific bookings manually
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_order_id UUID;
  v_affected_count INT;
BEGIN
  -- Only allow cancelling pending bookings that belong to the user
  UPDATE bookings
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE 
    id = p_booking_id
    AND user_id = p_user_id
    AND status = 'pending'
  RETURNING id INTO v_affected_count;
  
  -- If booking was updated, also check if we should cancel the entire order
  IF v_affected_count > 0 THEN
    -- Get the order ID for this booking
    SELECT order_id INTO v_order_id
    FROM order_items
    WHERE booking_id = p_booking_id;
    
    -- If all bookings in this order are now cancelled, cancel the order too
    IF v_order_id IS NOT NULL THEN
      UPDATE orders o
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE 
        o.id = v_order_id
        AND o.status = 'pending'
        AND NOT EXISTS (
          SELECT 1 
          FROM order_items oi
          JOIN bookings b ON b.id = oi.booking_id
          WHERE oi.order_id = v_order_id 
          AND b.status = 'pending'
        );
    END IF;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create a view for users to see only active bookings (not cancelled)
CREATE OR REPLACE VIEW active_bookings AS
SELECT b.*
FROM bookings b
WHERE b.status != 'cancelled'
ORDER BY b.created_at DESC;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_abandoned_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking(UUID, UUID) TO authenticated;
GRANT SELECT ON active_bookings TO authenticated;

-- Run initial cleanup
SELECT cleanup_abandoned_bookings();

-- Add a comment to bookings table about the pending state
COMMENT ON COLUMN bookings.status IS 'Booking status: pending (payment not completed), confirmed (payment successful), cancelled (user cancelled or expired), attended (customer showed up), no_show (customer did not show)';


