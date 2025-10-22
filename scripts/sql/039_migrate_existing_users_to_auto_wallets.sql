-- Migrate existing users to automatic wallet system
-- Migration: 039_migrate_existing_users_to_auto_wallets.sql

BEGIN;

-- Add function to migrate existing users without wallets
CREATE OR REPLACE FUNCTION migrate_users_to_auto_wallets()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  old_wallet_address TEXT,
  new_wallet_address TEXT,
  migration_status TEXT
) AS $$
DECLARE
  user_record RECORD;
  new_wallet_address TEXT;
  migration_count INTEGER := 0;
BEGIN
  -- Loop through all users who don't have wallets yet
  FOR user_record IN 
    SELECT id, email, wallet_address, created_at
    FROM profiles 
    WHERE wallet_address IS NULL
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Generate wallet address for existing user
      new_wallet_address := generate_wallet_address(
        user_record.email, 
        encode(digest(user_record.id::text || user_record.email, 'sha256'), 'hex')
      );
      
      -- Update user with new wallet address
      UPDATE profiles 
      SET 
        wallet_address = new_wallet_address,
        wallet_connected_at = NOW()
      WHERE id = user_record.id;
      
      -- Return migration result
      user_id := user_record.id;
      email := user_record.email;
      old_wallet_address := user_record.wallet_address;
      new_wallet_address := new_wallet_address;
      migration_status := 'SUCCESS';
      
      migration_count := migration_count + 1;
      
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return error result
      user_id := user_record.id;
      email := user_record.email;
      old_wallet_address := user_record.wallet_address;
      new_wallet_address := NULL;
      migration_status := 'ERROR: ' || SQLERRM;
      
      RETURN NEXT;
    END;
  END LOOP;
  
  -- Log migration summary
  RAISE NOTICE 'Migration completed. % users migrated to auto-wallets.', migration_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to regenerate wallets for users who want to change
CREATE OR REPLACE FUNCTION regenerate_user_wallet_safe(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  user_password_hash TEXT;
  new_wallet_address TEXT;
  old_wallet_address TEXT;
BEGIN
  -- Get user email and current wallet
  SELECT email, wallet_address INTO user_email, old_wallet_address 
  FROM profiles WHERE id = user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Generate new wallet address
  user_password_hash := encode(digest(user_id::text || user_email, 'sha256'), 'hex');
  new_wallet_address := generate_wallet_address(user_email, user_password_hash);
  
  -- Ensure new address is different from old one
  IF new_wallet_address = old_wallet_address THEN
    -- Add some randomness to make it different
    new_wallet_address := generate_wallet_address(
      user_email, 
      user_password_hash || extract(epoch from now())::text
    );
  END IF;
  
  -- Update user's wallet address
  UPDATE profiles 
  SET 
    wallet_address = new_wallet_address,
    wallet_connected_at = NOW()
  WHERE id = user_id;
  
  RETURN new_wallet_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to check migration status
CREATE OR REPLACE FUNCTION get_migration_status()
RETURNS TABLE (
  total_users INTEGER,
  users_with_wallets INTEGER,
  users_without_wallets INTEGER,
  migration_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_users,
    COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END)::INTEGER as users_with_wallets,
    COUNT(CASE WHEN wallet_address IS NULL THEN 1 END)::INTEGER as users_without_wallets,
    ROUND(
      (COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
      2
    ) as migration_percentage
  FROM profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add column to track wallet type (auto-generated vs external)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'auto_generated' 
CHECK (wallet_type IN ('auto_generated', 'external', 'migrated'));

-- Update existing users with wallets to 'external' type
UPDATE public.profiles 
SET wallet_type = 'external' 
WHERE wallet_address IS NOT NULL AND wallet_type = 'auto_generated';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_type 
ON public.profiles(wallet_type) 
WHERE wallet_type IS NOT NULL;

COMMIT;
