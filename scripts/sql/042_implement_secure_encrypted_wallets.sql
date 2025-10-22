-- Implement secure encrypted wallet storage
-- Migration: 042_implement_secure_encrypted_wallets.sql

BEGIN;

-- Add columns for encrypted wallet storage
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_encrypted_private_key TEXT,
ADD COLUMN IF NOT EXISTS wallet_encrypted_mnemonic TEXT,
ADD COLUMN IF NOT EXISTS wallet_encryption_iv TEXT,
ADD COLUMN IF NOT EXISTS wallet_encryption_auth_tag TEXT,
ADD COLUMN IF NOT EXISTS wallet_encryption_salt TEXT;

-- Add indexes for encrypted wallet data
CREATE INDEX IF NOT EXISTS idx_profiles_encrypted_wallet 
ON public.profiles(wallet_encrypted_private_key) 
WHERE wallet_encrypted_private_key IS NOT NULL;

-- Add function to check wallet encryption status
CREATE OR REPLACE FUNCTION check_wallet_encryption_status()
RETURNS TABLE (
  total_wallets INTEGER,
  encrypted_wallets INTEGER,
  unencrypted_wallets INTEGER,
  encryption_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_wallets,
    COUNT(CASE WHEN wallet_encrypted_private_key IS NOT NULL THEN 1 END)::INTEGER as encrypted_wallets,
    COUNT(CASE WHEN wallet_address IS NOT NULL AND wallet_encrypted_private_key IS NULL THEN 1 END)::INTEGER as unencrypted_wallets,
    ROUND(
      (COUNT(CASE WHEN wallet_encrypted_private_key IS NOT NULL THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END)::NUMERIC, 0)) * 100, 
      2
    ) as encryption_percentage
  FROM profiles 
  WHERE wallet_address IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to migrate wallet to encrypted storage
CREATE OR REPLACE FUNCTION migrate_wallet_to_encrypted_storage(
  user_id UUID,
  encrypted_private_key TEXT,
  encrypted_mnemonic TEXT,
  encryption_iv TEXT,
  encryption_auth_tag TEXT,
  encryption_salt TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET 
    wallet_encrypted_private_key = encrypted_private_key,
    wallet_encrypted_mnemonic = encrypted_mnemonic,
    wallet_encryption_iv = encryption_iv,
    wallet_encryption_auth_tag = encryption_auth_tag,
    wallet_encryption_salt = encryption_salt,
    wallet_security_level = 'high',
    wallet_consistency_checked_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add table for wallet security audit log
CREATE TABLE IF NOT EXISTS public.wallet_security_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  wallet_address TEXT,
  encryption_status TEXT,
  security_level TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for security audit
CREATE INDEX IF NOT EXISTS idx_wallet_security_audit_user_id 
ON public.wallet_security_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_security_audit_action 
ON public.wallet_security_audit(action);

CREATE INDEX IF NOT EXISTS idx_wallet_security_audit_created_at 
ON public.wallet_security_audit(created_at);

-- Add function to log wallet security events
CREATE OR REPLACE FUNCTION log_wallet_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_wallet_address TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.wallet_security_audit (
    user_id,
    action,
    wallet_address,
    encryption_status,
    security_level,
    success,
    error_message,
    ip_address,
    user_agent
  )
  SELECT 
    p_user_id,
    p_action,
    p_wallet_address,
    CASE 
      WHEN p.wallet_encrypted_private_key IS NOT NULL THEN 'encrypted'
      ELSE 'unencrypted'
    END,
    p.wallet_security_level,
    p_success,
    p_error_message,
    p_ip_address,
    p_user_agent
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Row Level Security policies for encrypted wallet data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own encrypted wallet data
CREATE POLICY "Users can read own encrypted wallet" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can only update their own encrypted wallet data
CREATE POLICY "Users can update own encrypted wallet" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add trigger to log wallet encryption events
CREATE OR REPLACE FUNCTION log_wallet_encryption_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when wallet encryption is added or changed
  IF (NEW.wallet_encrypted_private_key IS NOT NULL AND 
      (OLD.wallet_encrypted_private_key IS NULL OR 
       OLD.wallet_encrypted_private_key != NEW.wallet_encrypted_private_key)) THEN
    
    PERFORM log_wallet_security_event(
      NEW.id,
      'wallet_encrypted',
      NEW.wallet_address,
      true,
      NULL,
      NULL,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER wallet_encryption_change_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.wallet_encrypted_private_key IS DISTINCT FROM OLD.wallet_encrypted_private_key)
  EXECUTE FUNCTION log_wallet_encryption_change();

-- Add view for wallet security overview
CREATE OR REPLACE VIEW wallet_security_overview AS
SELECT 
  p.id as user_id,
  p.email,
  p.wallet_address,
  CASE 
    WHEN p.wallet_encrypted_private_key IS NOT NULL THEN 'encrypted'
    ELSE 'unencrypted'
  END as encryption_status,
  p.wallet_security_level,
  p.wallet_connected_at,
  p.wallet_consistency_checked_at,
  COUNT(wsa.id) as security_events_count,
  MAX(wsa.created_at) as last_security_event
FROM public.profiles p
LEFT JOIN public.wallet_security_audit wsa ON p.id = wsa.user_id
WHERE p.wallet_address IS NOT NULL
GROUP BY p.id, p.email, p.wallet_address, p.wallet_encrypted_private_key, p.wallet_security_level, p.wallet_connected_at, p.wallet_consistency_checked_at;

-- Grant necessary permissions
GRANT SELECT ON wallet_security_overview TO authenticated;

COMMIT;
