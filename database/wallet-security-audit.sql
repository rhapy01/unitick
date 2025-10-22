-- SECURITY AUDIT: Check wallet storage and encryption
-- This script will help verify wallet security

-- 1. Check what wallet data is actually stored
SELECT 
    id,
    email,
    wallet_address,
    wallet_salt,
    wallet_connected_at,
    created_at
FROM profiles 
WHERE wallet_address IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if any private keys or sensitive data is stored (should be NULL)
SELECT 
    id,
    email,
    wallet_address,
    wallet_salt,
    -- These fields should NOT exist or be NULL
    wallet_encrypted_private_key,
    wallet_encrypted_mnemonic,
    wallet_encryption_iv,
    wallet_encryption_auth_tag,
    wallet_encryption_salt
FROM profiles 
WHERE wallet_address IS NOT NULL
LIMIT 5;

-- 3. Check for duplicate wallet addresses (should be unique)
SELECT 
    wallet_address,
    COUNT(*) as user_count,
    array_agg(email) as emails
FROM profiles 
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- 4. Check wallet address format (should be valid Ethereum addresses)
SELECT 
    wallet_address,
    CASE 
        WHEN wallet_address ~ '^0x[a-fA-F0-9]{40}$' THEN 'Valid'
        ELSE 'Invalid'
    END as format_check
FROM profiles 
WHERE wallet_address IS NOT NULL
LIMIT 10;

-- 5. Check if salt is properly generated (should be unique)
SELECT 
    wallet_salt,
    COUNT(*) as salt_count
FROM profiles 
WHERE wallet_salt IS NOT NULL
GROUP BY wallet_salt
HAVING COUNT(*) > 1;
