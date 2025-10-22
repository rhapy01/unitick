-- Fix vendor stats after migration
-- This ensures all vendors have correct rating_count and comment_count

-- Update all vendor stats
UPDATE vendors
SET
  rating_count = COALESCE((
    SELECT COUNT(*)
    FROM vendor_reviews
    WHERE vendor_reviews.vendor_id = vendors.id
      AND rating IS NOT NULL
  ), 0),
  comment_count = COALESCE((
    SELECT COUNT(*)
    FROM vendor_reviews
    WHERE vendor_reviews.vendor_id = vendors.id
      AND comment IS NOT NULL
  ), 0),
  total_rating = COALESCE((
    SELECT SUM(rating)
    FROM vendor_reviews
    WHERE vendor_reviews.vendor_id = vendors.id
      AND rating IS NOT NULL
  ), 0),
  average_rating = COALESCE((
    SELECT AVG(rating)
    FROM vendor_reviews
    WHERE vendor_reviews.vendor_id = vendors.id
      AND rating IS NOT NULL
  ), 0);

-- Check results
SELECT
  id,
  business_name,
  rating_count,
  comment_count,
  average_rating,
  total_rating
FROM vendors
WHERE rating_count > 0 OR comment_count > 0
ORDER BY rating_count DESC, comment_count DESC;
