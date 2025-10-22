-- CRITICAL: Find the specific user with role='user' but has vendor profile
-- This is a security vulnerability that needs immediate attention

-- 1. Find the specific problematic user
SELECT 
    p.id,
    p.email,
    p.role as profile_role,
    p.full_name,
    p.created_at as profile_created_at,
    v.id as vendor_id,
    v.business_name,
    v.created_at as vendor_created_at,
    v.is_verified
FROM profiles p
INNER JOIN vendors v ON p.id = v.user_id
WHERE p.role = 'user'
ORDER BY v.created_at DESC;

-- 2. Get more details about this user's vendor profile
SELECT 
    p.email,
    p.full_name,
    p.role,
    v.business_name,
    v.description,
    v.contact_email,
    v.contact_phone,
    v.jurisdiction,
    v.categories,
    v.is_verified,
    v.created_at
FROM profiles p
INNER JOIN vendors v ON p.id = v.user_id
WHERE p.role = 'user';

-- 3. Check if this user has any listings (additional security concern)
SELECT 
    p.email,
    p.role,
    v.business_name,
    l.id as listing_id,
    l.title,
    l.service_type,
    l.price,
    l.is_active,
    l.created_at
FROM profiles p
INNER JOIN vendors v ON p.id = v.user_id
LEFT JOIN listings l ON v.id = l.vendor_id
WHERE p.role = 'user'
ORDER BY l.created_at DESC;

-- 4. Check if this user has any bookings (revenue impact)
SELECT 
    p.email,
    p.role,
    v.business_name,
    b.id as booking_id,
    b.status,
    b.total_amount,
    b.created_at
FROM profiles p
INNER JOIN vendors v ON p.id = v.user_id
LEFT JOIN bookings b ON v.id = b.vendor_id
WHERE p.role = 'user'
ORDER BY b.created_at DESC;
