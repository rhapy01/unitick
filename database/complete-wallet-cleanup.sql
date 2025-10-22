-- COMPLETE WALLET SYSTEM CLEANUP
-- Remove ALL wallet-related columns from profiles table
-- This will eliminate all conflicting wallet systems

BEGIN;

-- Drop all wallet-related columns
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS wallet_address,
DROP COLUMN IF EXISTS wallet_salt,
DROP COLUMN IF EXISTS wallet_connected_at,
DROP COLUMN IF EXISTS wallet_consistency_checked_at,
DROP COLUMN IF EXISTS wallet_type,
DROP COLUMN IF EXISTS wallet_security_level,
DROP COLUMN IF EXISTS wallet_creation_method,
DROP COLUMN IF EXISTS wallet_encrypted_private_key,
DROP COLUMN IF EXISTS wallet_encrypted_mnemonic,
DROP COLUMN IF EXISTS wallet_encryption_iv,
DROP COLUMN IF EXISTS wallet_encryption_auth_tag,
DROP COLUMN IF EXISTS wallet_encryption_salt;

-- Drop wallet-related indexes
DROP INDEX IF EXISTS idx_profiles_wallet_address;
DROP INDEX IF EXISTS idx_profiles_wallet_salt;
DROP INDEX IF EXISTS idx_profiles_wallet_type;
DROP INDEX IF EXISTS idx_profiles_encrypted_wallet;

-- Drop wallet-related functions
DROP FUNCTION IF EXISTS generate_enhanced_wallet_address(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS check_wallet_encryption_status();
DROP FUNCTION IF EXISTS migrate_wallet_to_encrypted_storage(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

COMMIT;

-- Verify cleanup
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'wallet%';
