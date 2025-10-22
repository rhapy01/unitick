-- Create idempotent payment confirmation function
CREATE OR REPLACE FUNCTION confirm_payment_transaction(
  p_order_id UUID,
  p_transaction_hash TEXT,
  p_booking_ids UUID[]
)
RETURNS VOID AS $$
BEGIN
  -- Update order status and transaction hash (idempotent)
  UPDATE orders 
  SET 
    status = 'confirmed',
    transaction_hash = p_transaction_hash,
    updated_at = NOW()
  WHERE id = p_order_id 
    AND (status != 'confirmed' OR transaction_hash IS NULL);

  -- Update all bookings to confirmed status
  UPDATE bookings 
  SET 
    status = 'confirmed',
    updated_at = NOW()
  WHERE id = ANY(p_booking_ids) 
    AND status != 'confirmed';

  -- Log the confirmation (optional)
  INSERT INTO ticket_verifications (order_id, vendor_id, verified_by, verified_at)
  SELECT 
    p_order_id,
    b.vendor_id,
    o.user_id,
    NOW()
  FROM orders o
  JOIN bookings b ON b.id = ANY(p_booking_ids)
  WHERE o.id = p_order_id
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
