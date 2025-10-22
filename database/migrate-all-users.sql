-- SQL commands to migrate all users to secure wallets
-- Run these in your Supabase SQL Editor

-- User: akintoyeisaac5@gmail.com
UPDATE profiles 
SET 
  wallet_address = '0x7eC3f68513b6b10d4B6d1B1B15859F716d550997',
  wallet_encrypted_private_key = 'encrypted_private_key_here',
  wallet_encrypted_mnemonic = 'encrypted_mnemonic_here',
  wallet_encryption_iv = 'encryption_iv_here',
  wallet_encryption_auth_tag = 'encryption_auth_tag_here',
  wallet_encryption_salt = 'encryption_salt_here',
  wallet_connected_at = NOW()
WHERE email = 'akintoyeisaac5@gmail.com';

-- User: reisofifi@gmail.com
UPDATE profiles 
SET 
  wallet_address = '0xC2F60f0Dc16d04f0c346EA9EdeD452231797d862',
  wallet_encrypted_private_key = 'encrypted_private_key_here',
  wallet_encrypted_mnemonic = 'encrypted_mnemonic_here',
  wallet_encryption_iv = 'encryption_iv_here',
  wallet_encryption_auth_tag = 'encryption_auth_tag_here',
  wallet_encryption_salt = 'encryption_salt_here',
  wallet_connected_at = NOW()
WHERE email = 'reisofifi@gmail.com';

-- User: craddy036@gmail.com
UPDATE profiles 
SET 
  wallet_address = '0x7d46eC8ae44A3Be9989FD1a24f2ebEE7dEE95a52',
  wallet_encrypted_private_key = 'encrypted_private_key_here',
  wallet_encrypted_mnemonic = 'encrypted_mnemonic_here',
  wallet_encryption_iv = 'encryption_iv_here',
  wallet_encryption_auth_tag = 'encryption_auth_tag_here',
  wallet_encryption_salt = 'encryption_salt_here',
  wallet_connected_at = NOW()
WHERE email = 'craddy036@gmail.com';

-- User: babrawitch001@gmail.com
UPDATE profiles 
SET 
  wallet_address = '0x8A944222703b7e47bb220fCFA34Cade07b906Ba5',
  wallet_encrypted_private_key = 'encrypted_private_key_here',
  wallet_encrypted_mnemonic = 'encrypted_mnemonic_here',
  wallet_encryption_iv = 'encryption_iv_here',
  wallet_encryption_auth_tag = 'encryption_auth_tag_here',
  wallet_encryption_salt = 'encryption_salt_here',
  wallet_connected_at = NOW()
WHERE email = 'babrawitch001@gmail.com';

-- User: bashytee22@gmail.com
UPDATE profiles 
SET 
  wallet_address = '0x3Dc134C173496b516550D4f3A071a6202659fE79',
  wallet_encrypted_private_key = 'encrypted_private_key_here',
  wallet_encrypted_mnemonic = 'encrypted_mnemonic_here',
  wallet_encryption_iv = 'encryption_iv_here',
  wallet_encryption_auth_tag = 'encryption_auth_tag_here',
  wallet_encryption_salt = 'encryption_salt_here',
  wallet_connected_at = NOW()
WHERE email = 'bashytee22@gmail.com';

-- Verify the updates
SELECT email, wallet_address, wallet_encrypted_private_key IS NOT NULL as has_encrypted_key
FROM profiles 
ORDER BY email;
