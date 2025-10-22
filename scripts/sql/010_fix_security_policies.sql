-- Fix security policies and add proper constraints
-- This script addresses the security vulnerabilities identified in the code review

-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can create miles" ON public.unila_miles;

-- Create more restrictive miles policy
CREATE POLICY "Users can create their own miles"
  ON public.unila_miles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors can create their own miles"
  ON public.unila_miles FOR INSERT
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- Add input validation constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.profiles 
ADD CONSTRAINT check_wallet_address_format 
CHECK (wallet_address IS NULL OR wallet_address ~* '^0x[a-fA-F0-9]{40}$');

ALTER TABLE public.vendors 
ADD CONSTRAINT check_vendor_wallet_address_format 
CHECK (wallet_address ~* '^0x[a-fA-F0-9]{40}$');

ALTER TABLE public.vendors 
ADD CONSTRAINT check_vendor_email_format 
CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add business logic constraints
ALTER TABLE public.listings 
ADD CONSTRAINT check_positive_price 
CHECK (price > 0);

ALTER TABLE public.listings 
ADD CONSTRAINT check_positive_capacity 
CHECK (capacity IS NULL OR capacity > 0);

ALTER TABLE public.listings 
ADD CONSTRAINT check_cancellation_days_range 
CHECK (cancellation_days IS NULL OR (cancellation_days >= 0 AND cancellation_days <= 30));

ALTER TABLE public.bookings 
ADD CONSTRAINT check_positive_quantity 
CHECK (quantity > 0);

ALTER TABLE public.bookings 
ADD CONSTRAINT check_positive_amounts 
CHECK (subtotal > 0 AND platform_fee >= 0 AND total_amount > 0);

ALTER TABLE public.orders 
ADD CONSTRAINT check_positive_order_amounts 
CHECK (total_amount > 0 AND platform_fee_total >= 0);

-- Add audit logging table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    operation,
    record_id,
    user_id,
    old_values,
    new_values
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_vendors ON public.vendors;
CREATE TRIGGER audit_vendors
  AFTER INSERT OR UPDATE OR DELETE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_orders ON public.orders;
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_bookings ON public.bookings;
CREATE TRIGGER audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Add wallet update restrictions (server-side validation)
CREATE OR REPLACE FUNCTION check_wallet_update_restriction()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if wallet address is being updated
  IF OLD.wallet_address IS DISTINCT FROM NEW.wallet_address THEN
    -- Check if wallet was connected less than 80 days ago
    IF OLD.wallet_connected_at IS NOT NULL AND 
       (NEW.wallet_connected_at - OLD.wallet_connected_at) < INTERVAL '80 days' THEN
      RAISE EXCEPTION 'Wallet address can only be updated once every 80 days for security reasons';
    END IF;
    
    -- Set the connection timestamp
    NEW.wallet_connected_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for wallet update restrictions
DROP TRIGGER IF EXISTS check_wallet_update ON public.profiles;
CREATE TRIGGER check_wallet_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION check_wallet_update_restriction();

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  operation TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits
CREATE POLICY "System can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (true);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_operation TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  -- Clean up old entries
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current count for this identifier and operation
  SELECT COUNT(*), MAX(window_start) INTO current_count, window_start
  FROM public.rate_limits
  WHERE identifier = p_identifier 
    AND operation = p_operation
    AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- If no entries or window expired, start new window
  IF current_count IS NULL OR current_count = 0 THEN
    INSERT INTO public.rate_limits (identifier, operation, count, window_start)
    VALUES (p_identifier, p_operation, 1, NOW());
    RETURN TRUE;
  END IF;
  
  -- Check if limit exceeded
  IF current_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Increment count
  UPDATE public.rate_limits 
  SET count = count + 1
  WHERE identifier = p_identifier 
    AND operation = p_operation
    AND window_start = window_start;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
