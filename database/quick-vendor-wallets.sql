-- Quick Vendor Wallets for Whitelisting
-- Simple query to get all vendor wallet addresses for testing multiple payments

-- 1. All vendor wallet addresses (for whitelisting)
SELECT 
    wallet_address,
    business_name,
    is_verified,
    verification_status
FROM vendors 
WHERE wallet_address IS NOT NULL 
ORDER BY is_verified DESC, business_name;

-- 2. Just the addresses (for easy copy-paste to whitelist)
SELECT wallet_address
FROM vendors 
WHERE wallet_address IS NOT NULL 
ORDER BY wallet_address;

-- 3. Verified vendors only (recommended for testing)
SELECT 
    wallet_address,
    business_name,
    contact_email
FROM vendors 
WHERE wallet_address IS NOT NULL 
  AND is_verified = true
ORDER BY business_name;

-- 4. Unverified vendors (for testing verification flow)
SELECT 
    wallet_address,
    business_name,
    contact_email,
    verification_status
FROM vendors 
WHERE wallet_address IS NOT NULL 
  AND is_verified = false
ORDER BY created_at DESC;

-- 5. Count summary
SELECT 
    COUNT(*) as total_vendors,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_vendors,
    COUNT(CASE WHEN is_verified = false THEN 1 END) as unverified_vendors,
    COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END) as vendors_with_wallets
FROM vendors;
