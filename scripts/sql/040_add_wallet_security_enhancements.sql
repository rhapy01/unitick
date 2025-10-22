-- Add enhanced security for wallet generation
-- Migration: 040_add_wallet_security_enhancements.sql

BEGIN;

-- Add salt column for enhanced deterministic wallet generation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_salt TEXT;

-- Add index for wallet salt
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_salt 
ON public.profiles(wallet_salt) 
WHERE wallet_salt IS NOT NULL;

-- Add wallet security level tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_security_level TEXT DEFAULT 'high' 
CHECK (wallet_security_level IN ('low', 'medium', 'high'));

-- Add wallet creation method tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_creation_method TEXT DEFAULT 'enhanced_deterministic' 
CHECK (wallet_creation_method IN ('random', 'deterministic', 'enhanced_deterministic', 'external'));

-- Add function to generate enhanced deterministic wallet address
CREATE OR REPLACE FUNCTION generate_enhanced_wallet_address(
  user_email TEXT, 
  user_password TEXT,
  wallet_salt TEXT DEFAULT NULL
)
RETURNS TABLE (
  wallet_address TEXT,
  generated_salt TEXT
) AS $$
DECLARE
  final_salt TEXT;
  combined_input TEXT;
  derived_key TEXT;
  wallet_addr TEXT;
BEGIN
  -- Generate salt if not provided
  IF wallet_salt IS NULL THEN
    final_salt := encode(gen_random_bytes(32), 'hex');
  ELSE
    final_salt := wallet_salt;
  END IF;
  
  -- Create combined input for key derivation
  combined_input := lower(user_email) || ':' || user_password;
  
  -- Derive key using PBKDF2 (simplified version for SQL)
  -- Note: In production, this should be done in application code with proper PBKDF2
  derived_key := encode(digest(combined_input || final_salt, 'sha256'), 'hex');
  
  -- Generate wallet address using derived key
  wallet_addr := '0x' || substring(derived_key, 1, 40);
  
  RETURN QUERY SELECT wallet_addr, final_salt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to update wallet security for existing users
CREATE OR REPLACE FUNCTION update_wallet_security()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  wallet_address TEXT,
  security_level TEXT,
  creation_method TEXT
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Update existing users with enhanced security settings
  FOR user_record IN 
    SELECT id, email, wallet_address, wallet_type
    FROM profiles 
    WHERE wallet_address IS NOT NULL
  LOOP
    -- Update security level and creation method
    UPDATE profiles 
    SET 
      wallet_security_level = CASE 
        WHEN wallet_type = 'auto_generated' THEN 'high'
        WHEN wallet_type = 'external' THEN 'medium'
        ELSE 'medium'
      END,
      wallet_creation_method = CASE 
        WHEN wallet_type = 'auto_generated' THEN 'enhanced_deterministic'
        WHEN wallet_type = 'external' THEN 'external'
        ELSE 'deterministic'
      END
    WHERE id = user_record.id;
    
    -- Return updated information
    RETURN QUERY 
    SELECT 
      user_record.id,
      user_record.email,
      user_record.wallet_address,
      CASE 
        WHEN user_record.wallet_type = 'auto_generated' THEN 'high'
        WHEN user_record.wallet_type = 'external' THEN 'medium'
        ELSE 'medium'
      END,
      CASE 
        WHEN user_record.wallet_type = 'auto_generated' THEN 'enhanced_deterministic'
        WHEN user_record.wallet_type = 'external' THEN 'external'
        ELSE 'deterministic'
      END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to check wallet security status
CREATE OR REPLACE FUNCTION get_wallet_security_status()
RETURNS TABLE (
  total_wallets INTEGER,
  high_security_wallets INTEGER,
  medium_security_wallets INTEGER,
  low_security_wallets INTEGER,
  enhanced_deterministic_wallets INTEGER,
  external_wallets INTEGER,
  wallets_with_salt INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_wallets,
    COUNT(CASE WHEN wallet_security_level = 'high' THEN 1 END)::INTEGER as high_security_wallets,
    COUNT(CASE WHEN wallet_security_level = 'medium' THEN 1 END)::INTEGER as medium_security_wallets,
    COUNT(CASE WHEN wallet_security_level = 'low' THEN 1 END)::INTEGER as low_security_wallets,
    COUNT(CASE WHEN wallet_creation_method = 'enhanced_deterministic' THEN 1 END)::INTEGER as enhanced_deterministic_wallets,
    COUNT(CASE WHEN wallet_creation_method = 'external' THEN 1 END)::INTEGER as external_wallets,
    COUNT(CASE WHEN wallet_salt IS NOT NULL THEN 1 END)::INTEGER as wallets_with_salt
  FROM profiles 
  WHERE wallet_address IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit log table for wallet operations
CREATE TABLE IF NOT EXISTS public.wallet_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  wallet_address TEXT,
  security_level TEXT,
  creation_method TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for audit log
CREATE INDEX IF NOT EXISTS idx_wallet_audit_log_user_id 
ON public.wallet_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_audit_log_created_at 
ON public.wallet_audit_log(created_at);

-- Add function to log wallet operations
CREATE OR REPLACE FUNCTION log_wallet_operation(
  p_user_id UUID,
  p_operation TEXT,
  p_wallet_address TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.wallet_audit_log (
    user_id,
    operation,
    wallet_address,
    security_level,
    creation_method,
    ip_address,
    user_agent
  )
  SELECT 
    p_user_id,
    p_operation,
    p_wallet_address,
    p.security_level,
    p.wallet_creation_method,
    p_ip_address,
    p_user_agent
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
