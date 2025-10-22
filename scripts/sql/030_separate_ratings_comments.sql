-- Migration: Separate ratings and comments in vendor review system
-- This allows users to leave ratings without comments and vice versa

-- Step 1: Make rating column nullable in vendor_reviews table
ALTER TABLE vendor_reviews
ALTER COLUMN rating DROP NOT NULL;

-- Step 2: Drop the UNIQUE constraint that prevents multiple reviews per user
-- First, we need to find and drop the constraint (it was on vendor_id, user_id)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name for the unique constraint on vendor_reviews
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'vendor_reviews'
      AND con.contype = 'u'
      AND att.attname IN ('vendor_id', 'user_id');

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE vendor_reviews DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Step 3: Add new columns to vendors table for separate counts
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Step 4: Update the trigger function to handle both ratings and comments
CREATE OR REPLACE FUNCTION update_vendor_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors
  SET
    rating_count = (SELECT COUNT(*) FROM vendor_reviews WHERE vendor_id = NEW.vendor_id AND rating IS NOT NULL),
    comment_count = (SELECT COUNT(*) FROM vendor_reviews WHERE vendor_id = NEW.vendor_id AND comment IS NOT NULL),
    total_rating = (SELECT COALESCE(SUM(rating), 0) FROM vendor_reviews WHERE vendor_id = NEW.vendor_id AND rating IS NOT NULL),
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM vendor_reviews
      WHERE vendor_id = NEW.vendor_id AND rating IS NOT NULL
    )
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update existing vendor stats to populate the new columns
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
  ), 0);

-- Step 6: Ensure the trigger is properly set up for future changes
DROP TRIGGER IF EXISTS update_vendor_stats_on_review ON vendor_reviews;
CREATE TRIGGER update_vendor_stats_on_review
AFTER INSERT OR UPDATE OR DELETE ON vendor_reviews
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating_stats();

-- Step 7: Update RLS policies if needed (should already exist from previous migration)
-- These policies should already be in place from the initial setup
