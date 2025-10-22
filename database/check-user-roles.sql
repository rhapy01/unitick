-- Script to check user roles and vendor status in the database
-- Run this in your Supabase SQL editor or psql

-- 1. Check all profiles with their roles
SELECT 
    id,
    email,
    role,
    full_name,
    created_at,
    wallet_address
FROM profiles 
ORDER BY created_at DESC;

-- 2. Count users by role
SELECT 
    role,
    COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY count DESC;

-- 3. Check which users have vendor profiles
SELECT 
    p.id,
    p.email,
    p.role as profile_role,
    p.full_name,
    v.id as vendor_id,
    v.business_name,
    v.is_verified,
    v.created_at as vendor_created_at
FROM profiles p
LEFT JOIN vendors v ON p.id = v.user_id
ORDER BY p.created_at DESC;

-- 4. Find users with 'user' role but have vendor profiles (potential bug)
SELECT 
    p.id,
    p.email,
    p.role as profile_role,
    p.full_name,
    v.id as vendor_id,
    v.business_name,
    v.created_at as vendor_created_at
FROM profiles p
INNER JOIN vendors v ON p.id = v.user_id
WHERE p.role = 'user'
ORDER BY v.created_at DESC;

-- 5. Find users with 'vendor' role but no vendor profile
SELECT 
    p.id,
    p.email,
    p.role as profile_role,
    p.full_name,
    p.created_at
FROM profiles p
LEFT JOIN vendors v ON p.id = v.user_id
WHERE p.role = 'vendor' AND v.id IS NULL
ORDER BY p.created_at DESC;

-- 6. Summary statistics
SELECT 
    'Total Profiles' as metric,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Users with Vendor Role' as metric,
    COUNT(*) as count
FROM profiles 
WHERE role = 'vendor'
UNION ALL
SELECT 
    'Users with User Role' as metric,
    COUNT(*) as count
FROM profiles 
WHERE role = 'user'
UNION ALL
SELECT 
    'Total Vendor Profiles' as metric,
    COUNT(*) as count
FROM vendors
UNION ALL
SELECT 
    'Users with User Role but Vendor Profile (BUG)' as metric,
    COUNT(*) as count
FROM profiles p
INNER JOIN vendors v ON p.id = v.user_id
WHERE p.role = 'user'
UNION ALL
SELECT 
    'Users with Vendor Role but No Vendor Profile' as metric,
    COUNT(*) as count
FROM profiles p
LEFT JOIN vendors v ON p.id = v.user_id
WHERE p.role = 'vendor' AND v.id IS NULL;
