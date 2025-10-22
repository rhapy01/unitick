-- Fix wallet mismatch by creating new wallet data
-- Run this in your Supabase SQL Editor

-- First, let's see the current data
SELECT email, wallet_address, wallet_encrypted_private_key IS NOT NULL as has_private_key
FROM profiles 
WHERE email = 'akintoyeisaac5@gmail.com';

-- The solution is to either:
-- 1. Generate a new wallet and update the address (recommended)
-- 2. Or find the correct private key for the current address (impossible)

-- Option 1: Generate new wallet data (you'll need to run this from the app)
-- The user will need to:
-- 1. Go to wallet management page
-- 2. Export current wallet (if they have the private key)
-- 3. Create a new wallet
-- 4. Update their profile

-- Option 2: Temporary fix - remove the encrypted private key
-- This will force the system to create a new wallet
UPDATE profiles 
SET 
  wallet_encrypted_private_key = NULL,
  wallet_encrypted_mnemonic = NULL,
  wallet_encryption_iv = NULL,
  wallet_encryption_auth_tag = NULL,
  wallet_encryption_salt = NULL
WHERE email = 'akintoyeisaac5@gmail.com';

-- Verify the update
SELECT email, wallet_address, wallet_encrypted_private_key IS NOT NULL as has_private_key
FROM profiles 
WHERE email = 'akintoyeisaac5@gmail.com';
