-- Vendor Wallets Whitelist Schema
-- This query shows all current vendor wallets that need to be whitelisted for testing multiple payments

-- Main query to get all vendor wallets with their details
SELECT 
    v.id as vendor_id,
    v.business_name,
    v.company_name,
    v.contact_email,
    v.wallet_address,
    v.is_verified,
    v.verification_status,
    v.jurisdiction,
    v.categories,
    v.created_at as vendor_created_at,
    p.email as user_email,
    p.full_name as user_full_name,
    p.role as user_role,
    p.wallet_connected_at,
    -- Additional wallet info from profiles table
    p.wallet_address as profile_wallet_address,
    p.wallet_salt,
    p.wallet_security_level,
    p.wallet_creation_method,
    -- Check if wallet addresses match between vendors and profiles
    CASE 
        WHEN v.wallet_address = p.wallet_address THEN 'MATCH'
        WHEN v.wallet_address IS NULL THEN 'VENDOR_NULL'
        WHEN p.wallet_address IS NULL THEN 'PROFILE_NULL'
        ELSE 'MISMATCH'
    END as wallet_consistency_status,
    -- Count of listings for this vendor
    (SELECT COUNT(*) FROM listings l WHERE l.vendor_id = v.id AND l.is_active = true) as active_listings_count,
    -- Count of completed bookings for this vendor
    (SELECT COUNT(*) FROM bookings b WHERE b.vendor_id = v.id AND b.status = 'completed') as completed_bookings_count
FROM vendors v
LEFT JOIN profiles p ON v.user_id = p.id
WHERE v.wallet_address IS NOT NULL  -- Only vendors with wallet addresses
ORDER BY 
    v.is_verified DESC,  -- Verified vendors first
    v.created_at DESC;   -- Then by creation date

-- Summary statistics
-- Uncomment the query below to get summary statistics
/*
SELECT 
    COUNT(*) as total_vendors_with_wallets,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_vendors,
    COUNT(CASE WHEN is_verified = false THEN 1 END) as unverified_vendors,
    COUNT(CASE WHEN wallet_consistency_status = 'MATCH' THEN 1 END) as wallets_with_consistency_match,
    COUNT(CASE WHEN wallet_consistency_status = 'MISMATCH' THEN 1 END) as wallets_with_consistency_mismatch,
    COUNT(CASE WHEN wallet_consistency_status = 'VENDOR_NULL' THEN 1 END) as vendors_with_null_wallet,
    COUNT(CASE WHEN wallet_consistency_status = 'PROFILE_NULL' THEN 1 END) as profiles_with_null_wallet
FROM (
    SELECT 
        v.id,
        v.is_verified,
        CASE 
            WHEN v.wallet_address = p.wallet_address THEN 'MATCH'
            WHEN v.wallet_address IS NULL THEN 'VENDOR_NULL'
            WHEN p.wallet_address IS NULL THEN 'PROFILE_NULL'
            ELSE 'MISMATCH'
        END as wallet_consistency_status
    FROM vendors v
    LEFT JOIN profiles p ON v.user_id = p.id
    WHERE v.wallet_address IS NOT NULL
) vendor_stats;
*/

-- Quick whitelist addresses only (for easy copy-paste)
-- Uncomment the query below to get just the wallet addresses for whitelisting
/*
SELECT DISTINCT wallet_address
FROM vendors 
WHERE wallet_address IS NOT NULL 
ORDER BY wallet_address;
*/

-- Verification status breakdown
-- Uncomment the query below to see verification status breakdown
/*
SELECT 
    verification_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM vendors 
WHERE wallet_address IS NOT NULL
GROUP BY verification_status
ORDER BY count DESC;
*/

-- Jurisdiction breakdown
-- Uncomment the query below to see jurisdiction breakdown
/*
SELECT 
    jurisdiction,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM vendors 
WHERE wallet_address IS NOT NULL
GROUP BY jurisdiction
ORDER BY count DESC;
*/

-- Service categories breakdown
-- Uncomment the query below to see service categories breakdown
/*
SELECT 
    unnest(categories) as service_category,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM vendors 
WHERE wallet_address IS NOT NULL AND categories IS NOT NULL
GROUP BY unnest(categories)
ORDER BY count DESC;
*/
