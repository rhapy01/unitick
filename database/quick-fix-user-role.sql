-- QUICK FIX: Update user role from 'user' to 'vendor' for craddy036@gmail.com
-- Since this is testnet, we'll just fix the role mismatch

-- Step 1: Update the user's role to 'vendor' (they already have a business profile)
UPDATE profiles 
SET role = 'vendor' 
WHERE email = 'craddy036@gmail.com' 
AND role = 'user';

-- Step 2: Verify the fix worked
SELECT 
    p.email,
    p.role,
    v.business_name,
    v.is_verified
FROM profiles p
LEFT JOIN vendors v ON p.id = v.user_id
WHERE p.email = 'craddy036@gmail.com';

-- Step 3: Final verification - should show 0 problematic users
SELECT 
    'Users with User Role but Vendor Profile (BUG)' as metric,
    COUNT(*) as count
FROM profiles p
INNER JOIN vendors v ON p.id = v.user_id
WHERE p.role = 'user';

-- Step 4: Complete status check
SELECT 
    role,
    COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY count DESC;
