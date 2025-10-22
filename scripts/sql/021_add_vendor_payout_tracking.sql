-- Add vendor payout tracking for platform fee deduction
CREATE TABLE IF NOT EXISTS vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gross_amount DECIMAL(10, 2) NOT NULL, -- Total amount received from user
  platform_fee DECIMAL(10, 2) NOT NULL, -- Fee deducted by platform
  net_amount DECIMAL(10, 2) NOT NULL, -- Amount vendor actually receives
  transaction_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_order_id ON vendor_payouts(order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON vendor_payouts(status);

-- Enable RLS
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Vendors can view their own payouts" ON vendor_payouts FOR SELECT 
USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Platform can manage all payouts" ON vendor_payouts FOR ALL 
USING (auth.jwt() ->> 'role' = 'platform_admin');

-- Function to create payout record when payment is confirmed
CREATE OR REPLACE FUNCTION create_vendor_payout()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create payout for confirmed orders
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    INSERT INTO vendor_payouts (
      vendor_id,
      order_id,
      gross_amount,
      platform_fee,
      net_amount,
      transaction_hash
    )
    SELECT 
      b.vendor_id,
      NEW.id,
      NEW.total_amount,
      NEW.platform_fee_total,
      NEW.total_amount - NEW.platform_fee_total,
      NEW.transaction_hash
    FROM bookings b
    WHERE b.id IN (
      SELECT booking_id FROM order_items WHERE order_id = NEW.id
    )
    LIMIT 1; -- For now, assume single vendor per order
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create payout records
CREATE TRIGGER create_payout_on_payment_confirmation
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION create_vendor_payout();
