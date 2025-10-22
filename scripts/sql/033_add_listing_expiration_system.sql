-- Automatic Listing Expiration System
-- This script creates functions and triggers to automatically deactivate listings
-- when their event dates have passed or when they reach their expiration date

BEGIN;

-- Function to deactivate expired listings
CREATE OR REPLACE FUNCTION deactivate_expired_listings()
RETURNS TABLE (
  deactivated_count INTEGER,
  deactivated_listings UUID[]
) AS $$
DECLARE
  expired_listings UUID[];
  listing_id UUID;
BEGIN
  -- Find listings that should be deactivated
  -- 1. Listings with available_dates where all dates have passed
  -- 2. Listings with available_to date that has passed
  -- 3. Only active listings
  
  SELECT ARRAY_AGG(id) INTO expired_listings
  FROM listings
  WHERE is_active = true
  AND (
    -- Case 1: available_dates array exists and all dates have passed
    (available_dates IS NOT NULL AND 
     NOT EXISTS (
       SELECT 1 FROM unnest(available_dates) AS date_val 
       WHERE date_val >= CURRENT_DATE
     ))
    OR
    -- Case 2: available_to date has passed
    (available_to IS NOT NULL AND available_to < NOW())
  );

  -- Deactivate the expired listings
  IF expired_listings IS NOT NULL AND array_length(expired_listings, 1) > 0 THEN
    UPDATE listings
    SET 
      is_active = false,
      updated_at = NOW()
    WHERE id = ANY(expired_listings);
    
    -- Log the deactivation
    INSERT INTO listing_deactivation_log (
      listing_ids,
      reason,
      deactivated_at
    ) VALUES (
      expired_listings,
      'automatic_expiration',
      NOW()
    );
  END IF;

  -- Return results
  RETURN QUERY SELECT 
    COALESCE(array_length(expired_listings, 1), 0)::INTEGER,
    COALESCE(expired_listings, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table to log listing deactivations
CREATE TABLE IF NOT EXISTS listing_deactivation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_ids UUID[] NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('automatic_expiration', 'manual_deactivation', 'vendor_request')),
  deactivated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_by UUID REFERENCES profiles(id), -- NULL for automatic deactivations
  notes TEXT
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_listing_deactivation_log_date 
ON listing_deactivation_log(deactivated_at);

-- Function to check if a specific listing should be expired
CREATE OR REPLACE FUNCTION check_listing_expiration(p_listing_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  should_expire BOOLEAN := FALSE;
  listing_record RECORD;
BEGIN
  -- Get the listing details
  SELECT * INTO listing_record
  FROM listings
  WHERE id = p_listing_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check expiration conditions
  IF listing_record.available_dates IS NOT NULL THEN
    -- Check if all available dates have passed
    should_expire := NOT EXISTS (
      SELECT 1 FROM unnest(listing_record.available_dates) AS date_val 
      WHERE date_val >= CURRENT_DATE
    );
  ELSIF listing_record.available_to IS NOT NULL THEN
    -- Check if available_to date has passed
    should_expire := listing_record.available_to < NOW();
  END IF;
  
  RETURN should_expire;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually deactivate a listing (for vendors)
CREATE OR REPLACE FUNCTION manual_deactivate_listing(
  p_listing_id UUID,
  p_vendor_id UUID,
  p_reason TEXT DEFAULT 'manual_deactivation',
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Only allow vendor to deactivate their own listings
  UPDATE listings
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE 
    id = p_listing_id 
    AND vendor_id = p_vendor_id
    AND is_active = true
  RETURNING id INTO affected_count;
  
  -- Log the manual deactivation
  IF affected_count > 0 THEN
    INSERT INTO listing_deactivation_log (
      listing_ids,
      reason,
      deactivated_at,
      deactivated_by,
      notes
    ) VALUES (
      ARRAY[p_listing_id],
      p_reason,
      NOW(),
      p_vendor_id,
      p_notes
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deactivate_expired_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION check_listing_expiration(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_deactivate_listing(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT SELECT, INSERT ON listing_deactivation_log TO authenticated;

-- Add RLS policies for the log table
ALTER TABLE listing_deactivation_log ENABLE ROW LEVEL SECURITY;

-- Users can view deactivation logs for their own listings
CREATE POLICY "Users can view deactivation logs for their listings"
ON listing_deactivation_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM listings l
    WHERE l.id = ANY(listing_deactivation_log.listing_ids)
    AND l.vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  )
);

-- Add comment to listings table about expiration
COMMENT ON COLUMN listings.available_dates IS 'Array of dates when the service/event is available. Listing will be automatically deactivated when all dates have passed.';
COMMENT ON COLUMN listings.available_to IS 'End date/time for the listing availability. Listing will be automatically deactivated when this date passes.';
COMMENT ON COLUMN listings.is_active IS 'Whether the listing is currently active and visible to users. Automatically set to false when expiration conditions are met.';

COMMIT;

