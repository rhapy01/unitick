-- Clean up database and standardize on secure wallet system
-- Run this in your Supabase SQL Editor

-- Step 1: Clear all wallet data to start fresh
UPDATE profiles 
SET 
  wallet_address = NULL,
  wallet_encrypted_private_key = NULL,
  wallet_encrypted_mnemonic = NULL,
  wallet_encryption_iv = NULL,
  wallet_encryption_auth_tag = NULL,
  wallet_encryption_salt = NULL,
  wallet_connected_at = NULL,
  wallet_salt = NULL
WHERE wallet_address IS NOT NULL;

-- Step 2: Verify cleanup
SELECT 
  email,
  wallet_address,
  wallet_encrypted_private_key IS NOT NULL as has_encrypted_key,
  wallet_salt IS NOT NULL as has_old_salt
FROM profiles 
WHERE wallet_address IS NOT NULL OR wallet_encrypted_private_key IS NOT NULL;

-- Step 3: Show users that will need new wallets
SELECT 
  email,
  created_at,
  'Needs new wallet' as status
FROM profiles 
WHERE wallet_address IS NULL
ORDER BY created_at DESC;
