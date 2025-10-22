-- FIX SCRIPT: Resolve user with role='user' but has vendor profile
-- This script will fix the security vulnerability

-- STEP 1: Identify the problematic user (run this first to see who it is)
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
WHERE p.role = 'user';

-- STEP 2: Choose one of these fixes:

-- OPTION A: Update the user's role to 'vendor' (if they should be a vendor)
-- Replace 'USER_ID_HERE' with the actual user ID from step 1
/*
UPDATE profiles 
SET role = 'vendor' 
WHERE id = 'USER_ID_HERE' 
AND role = 'user';
*/

-- OPTION B: Delete the vendor profile (if they shouldn't be a vendor)
-- Replace 'USER_ID_HERE' with the actual user ID from step 1
/*
DELETE FROM vendors 
WHERE user_id = 'USER_ID_HERE';
*/

-- STEP 3: Verify the fix worked
SELECT 
    'After Fix - Users with User Role but Vendor Profile' as metric,
    COUNT(*) as count
FROM profiles p
INNER JOIN vendors v ON p.id = v.user_id
WHERE p.role = 'user';

-- STEP 4: Final verification - should show 0
SELECT 
    p.email,
    p.role,
    v.business_name
FROM profiles p
INNER JOIN vendors v ON p.id = v.user_id
WHERE p.role = 'user';
