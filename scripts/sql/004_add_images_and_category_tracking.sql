-- Add images column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add categories_updated_at to vendors table to track when categories were last updated
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS categories_updated_at TIMESTAMPTZ;

-- Removed the UPDATE statement that was locking out new vendors
-- categories_updated_at should only be set when categories are actually updated, not on creation
