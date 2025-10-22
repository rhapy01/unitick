-- COMPLETE WALLET SYSTEM CLEANUP WITH DEPENDENCIES
-- This script drops ALL wallet-related objects and columns

BEGIN;

-- 1. Drop all views that depend on wallet columns
DROP VIEW IF EXISTS wallet_security_overview CASCADE;

-- 2. Drop all functions that depend on wallet columns
DROP FUNCTION IF EXISTS check_wallet_availability(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_by_wallet(TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_enhanced_wallet_address(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_consistent_wallet_address(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS validate_wallet_consistency(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_wallet_encryption_status() CASCADE;
DROP FUNCTION IF EXISTS migrate_wallet_to_encrypted_storage(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS log_wallet_encryption_change() CASCADE;

-- 3. Drop all triggers that depend on wallet columns
DROP TRIGGER IF EXISTS wallet_encryption_audit_trigger ON public.profiles CASCADE;

-- 4. Drop all constraints that depend on wallet columns
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_wallet_address_unique CASCADE;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_wallet_address_format CASCADE;

-- 5. Drop all indexes that depend on wallet columns
DROP INDEX IF EXISTS idx_profiles_wallet_address CASCADE;
DROP INDEX IF EXISTS idx_profiles_wallet_salt CASCADE;
DROP INDEX IF EXISTS idx_profiles_wallet_type CASCADE;
DROP INDEX IF EXISTS idx_profiles_encrypted_wallet CASCADE;
DROP INDEX IF EXISTS idx_profiles_wallet_consistency CASCADE;

-- 6. Drop all wallet-related columns
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS wallet_address CASCADE,
DROP COLUMN IF EXISTS wallet_salt CASCADE,
DROP COLUMN IF EXISTS wallet_connected_at CASCADE,
DROP COLUMN IF EXISTS wallet_consistency_checked_at CASCADE,
DROP COLUMN IF EXISTS wallet_type CASCADE,
DROP COLUMN IF EXISTS wallet_security_level CASCADE,
DROP COLUMN IF EXISTS wallet_creation_method CASCADE,
DROP COLUMN IF EXISTS wallet_encrypted_private_key CASCADE,
DROP COLUMN IF EXISTS wallet_encrypted_mnemonic CASCADE,
DROP COLUMN IF EXISTS wallet_encryption_iv CASCADE,
DROP COLUMN IF EXISTS wallet_encryption_auth_tag CASCADE,
DROP COLUMN IF EXISTS wallet_encryption_salt CASCADE;

-- 7. Drop any remaining wallet-related tables
DROP TABLE IF EXISTS wallet_security_audit CASCADE;

COMMIT;

-- Verify cleanup - should return no results
SELECT 
  table_name,
  column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'wallet%';

-- Verify no wallet-related functions remain
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%wallet%' 
AND routine_schema = 'public';

-- Verify no wallet-related views remain
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name LIKE '%wallet%' 
AND table_schema = 'public';
