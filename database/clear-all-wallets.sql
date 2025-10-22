-- Simple approach: Clear all wallet data and let system create new ones
-- Run this in your Supabase SQL Editor

-- Clear all wallet data
UPDATE profiles 
SET 
  wallet_address = NULL,
  wallet_encrypted_private_key = NULL,
  wallet_encrypted_mnemonic = NULL,
  wallet_encryption_iv = NULL,
  wallet_encryption_auth_tag = NULL,
  wallet_encryption_salt = NULL,
  wallet_connected_at = NULL,
  wallet_salt = NULL;

-- Verify cleanup
SELECT 
  email,
  wallet_address,
  wallet_encrypted_private_key IS NOT NULL as has_encrypted_key
FROM profiles 
ORDER BY email;
