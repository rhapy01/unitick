-- Insert sample verified vendor
INSERT INTO vendors (
  id,
  user_id,
  business_name,
  company_name,
  physical_address,
  business_registration_number,
  logo_url,
  description,
  categories,
  is_verified,
  verification_status,
  is_featured,
  average_rating,
  review_count,
  like_count,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1), -- Uses first user, or you can create a specific vendor user
  'Luxury Stays International',
  'Luxury Stays International',
  '123 Premium Boulevard, Downtown District',
  'BRN-2024-LSI-001',
  '/placeholder.svg?height=200&width=200',
  'Premium accommodation provider offering world-class hotels and serviced apartments across major cities. Experience luxury and comfort with our verified properties.',
  ARRAY['accommodation', 'tours']::service_type[],
  true,
  'approved',
  true,
  4.8,
  127,
  89,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample reviews for the vendor
INSERT INTO vendor_reviews (
  vendor_id,
  user_id,
  rating,
  comment,
  created_at
)
SELECT 
  (SELECT id FROM vendors WHERE company_name = 'Luxury Stays International' LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  5,
  'Excellent service! The booking process was seamless and the accommodation exceeded expectations.',
  NOW() - INTERVAL '5 days'
WHERE EXISTS (SELECT 1 FROM vendors WHERE company_name = 'Luxury Stays International');

INSERT INTO vendor_reviews (
  vendor_id,
  user_id,
  rating,
  comment,
  created_at
)
SELECT 
  (SELECT id FROM vendors WHERE company_name = 'Luxury Stays International' LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  4,
  'Great experience overall. Would definitely book again!',
  NOW() - INTERVAL '12 days'
WHERE EXISTS (SELECT 1 FROM vendors WHERE company_name = 'Luxury Stays International');

-- Insert sample likes
INSERT INTO vendor_likes (
  vendor_id,
  user_id,
  created_at
)
SELECT 
  (SELECT id FROM vendors WHERE company_name = 'Luxury Stays International' LIMIT 1),
  id,
  NOW()
FROM auth.users
LIMIT 15
ON CONFLICT DO NOTHING;
