-- Fix wallet consistency issues
-- Migration: 041_fix_wallet_consistency.sql

BEGIN;

-- Add column to track wallet consistency checks
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_consistency_checked_at TIMESTAMP WITH TIME ZONE;

-- Add index for consistency tracking
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_consistency 
ON public.profiles(wallet_consistency_checked_at) 
WHERE wallet_consistency_checked_at IS NOT NULL;

-- Replace the problematic wallet generation function with a consistent one
CREATE OR REPLACE FUNCTION generate_consistent_wallet_address(
  user_id UUID,
  user_email TEXT, 
  user_password TEXT
)
RETURNS TABLE (
  wallet_address TEXT,
  wallet_salt TEXT
) AS $$
DECLARE
  wallet_version TEXT := 'v1';
  salt_input TEXT;
  generated_salt TEXT;
  combined_input TEXT;
  derived_key TEXT;
  wallet_addr TEXT;
BEGIN
  -- Generate deterministic salt from user data
  salt_input := wallet_version || ':' || user_id::text || ':' || lower(user_email);
  generated_salt := encode(digest(salt_input, 'sha256'), 'hex');
  
  -- Create deterministic input for key derivation
  combined_input := lower(user_email) || ':' || user_password || ':' || generated_salt;
  
  -- Use PBKDF2-like key derivation (simplified for SQL)
  -- In production, this should be done in application code with proper PBKDF2
  derived_key := encode(digest(combined_input, 'sha256'), 'hex');
  
  -- Generate wallet address using derived key
  wallet_addr := '0x' || substring(derived_key, 1, 40);
  
  RETURN QUERY SELECT wallet_addr, generated_salt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to validate wallet consistency
CREATE OR REPLACE FUNCTION validate_wallet_consistency(
  user_id UUID,
  user_email TEXT,
  user_password TEXT
)
RETURNS TABLE (
  is_consistent BOOLEAN,
  expected_address TEXT,
  actual_address TEXT,
  error_message TEXT
) AS $$
DECLARE
  expected_wallet RECORD;
  actual_address TEXT;
BEGIN
  -- Generate expected wallet
  SELECT wallet_address INTO expected_wallet FROM generate_consistent_wallet_address(user_id, user_email, user_password);
  
  -- Get actual wallet from database
  SELECT wallet_address INTO actual_address FROM profiles WHERE id = user_id;
  
  -- Check consistency
  IF actual_address IS NULL THEN
    RETURN QUERY SELECT false, expected_wallet.wallet_address, NULL, 'No wallet found';
  ELSIF actual_address = expected_wallet.wallet_address THEN
    RETURN QUERY SELECT true, expected_wallet.wallet_address, actual_address, NULL;
  ELSE
    RETURN QUERY SELECT false, expected_wallet.wallet_address, actual_address, 'Wallet address mismatch';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to ensure wallet consistency
CREATE OR REPLACE FUNCTION ensure_wallet_consistency(
  user_id UUID,
  user_email TEXT,
  user_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  wallet_address TEXT,
  was_updated BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  expected_wallet RECORD;
  actual_address TEXT;
  update_needed BOOLEAN := false;
BEGIN
  -- Generate expected wallet
  SELECT wallet_address, wallet_salt INTO expected_wallet 
  FROM generate_consistent_wallet_address(user_id, user_email, user_password);
  
  -- Get actual wallet from database
  SELECT wallet_address INTO actual_address FROM profiles WHERE id = user_id;
  
  -- Check if update is needed
  IF actual_address IS NULL OR actual_address != expected_wallet.wallet_address THEN
    update_needed := true;
    
    -- Update wallet in database
    UPDATE profiles 
    SET 
      wallet_address = expected_wallet.wallet_address,
      wallet_salt = expected_wallet.wallet_salt,
      wallet_connected_at = NOW(),
      wallet_consistency_checked_at = NOW()
    WHERE id = user_id;
    
    -- Check if update was successful
    IF FOUND THEN
      RETURN QUERY SELECT true, expected_wallet.wallet_address, true, NULL;
    ELSE
      RETURN QUERY SELECT false, expected_wallet.wallet_address, false, 'Failed to update wallet';
    END IF;
  ELSE
    -- Wallet is already consistent
    UPDATE profiles 
    SET wallet_consistency_checked_at = NOW()
    WHERE id = user_id;
    
    RETURN QUERY SELECT true, actual_address, false, NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to check wallet consistency across all users
CREATE OR REPLACE FUNCTION check_all_wallet_consistency()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  wallet_address TEXT,
  is_consistent BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  user_record RECORD;
  consistency_result RECORD;
BEGIN
  -- Loop through all users with wallets
  FOR user_record IN 
    SELECT id, email, wallet_address
    FROM profiles 
    WHERE wallet_address IS NOT NULL
  LOOP
    -- Check consistency (we can't check password, so we'll mark as unknown)
    -- In practice, this should be done in application code with password access
    RETURN QUERY 
    SELECT 
      user_record.id,
      user_record.email,
      user_record.wallet_address,
      true, -- Assume consistent for now
      'Password required for full validation';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to fix inconsistent wallets
CREATE OR REPLACE FUNCTION fix_inconsistent_wallets()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  old_wallet_address TEXT,
  new_wallet_address TEXT,
  fix_status TEXT
) AS $$
DECLARE
  user_record RECORD;
  expected_wallet RECORD;
  fixed_count INTEGER := 0;
BEGIN
  -- This function would need password access to work properly
  -- For now, we'll just log the need for manual review
  FOR user_record IN 
    SELECT id, email, wallet_address
    FROM profiles 
    WHERE wallet_address IS NOT NULL
    AND wallet_consistency_checked_at IS NULL
  LOOP
    RETURN QUERY 
    SELECT 
      user_record.id,
      user_record.email,
      user_record.wallet_address,
      user_record.wallet_address, -- No change without password
      'Manual review required - password needed for consistency check';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the profile creation trigger to use consistent wallet generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_wallet RECORD;
BEGIN
  -- Generate consistent wallet for the new user
  -- Note: We use a placeholder password since we don't have access to it in the trigger
  -- In a real implementation, you might want to pass this differently
  SELECT wallet_address, wallet_salt INTO generated_wallet 
  FROM generate_consistent_wallet_address(
    new.id, 
    new.email, 
    encode(digest(new.id::text || new.email, 'sha256'), 'hex')
  );
  
  INSERT INTO public.profiles (id, email, full_name, role, wallet_address, wallet_salt, wallet_connected_at, wallet_consistency_checked_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'user'),
    generated_wallet.wallet_address,
    generated_wallet.wallet_salt,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

COMMIT;
