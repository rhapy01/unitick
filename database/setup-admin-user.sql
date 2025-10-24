-- Script to set up an admin user
-- This script allows you to promote a user to admin role
-- You can run this directly in Supabase SQL Editor

-- Option 1: Set a specific user as admin by email
-- Replace 'your-email@example.com' with the actual email address
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the admin user was created
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE role = 'admin';

-- Option 2: Set the first user as admin (useful for initial setup)
-- This will make the oldest user account an admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id 
    FROM profiles 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- Option 3: Check all users before making changes
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- Option 4: Create admin user from auth.users email
-- Replace 'admin@example.com' with your admin email
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin@example.com'
);

-- Final verification: Check admin users
SELECT 
    COUNT(*) as total_admin_users,
    array_agg(email) as admin_emails
FROM profiles 
WHERE role = 'admin';

