-- Enhanced location-based filtering system
-- This migration adds comprehensive location support for listings and vendors

-- Add enhanced location fields to listings table
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS radius_km INTEGER DEFAULT 10 CHECK (radius_km > 0 AND radius_km <= 1000),
  ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS location_verified_at TIMESTAMPTZ;

-- Add location fields to vendors table for better jurisdiction management
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS business_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS business_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 50 CHECK (service_radius_km > 0 AND service_radius_km <= 1000);

-- Create location-based indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(country_code, state_province, city);
CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON public.listings(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_radius ON public.listings(radius_km) WHERE radius_km IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_location ON public.vendors(country_code, state_province, city);
CREATE INDEX IF NOT EXISTS idx_vendors_coordinates ON public.vendors(business_latitude, business_longitude) WHERE business_latitude IS NOT NULL AND business_longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_service_radius ON public.vendors(service_radius_km) WHERE service_radius_km IS NOT NULL;

-- Create a function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  earth_radius_km DOUBLE PRECISION := 6371;
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius_km * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to find listings within radius
CREATE OR REPLACE FUNCTION find_listings_near_location(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 50,
  service_type_filter TEXT DEFAULT NULL,
  country_filter TEXT DEFAULT NULL
) RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  city TEXT,
  state_province TEXT,
  country_code VARCHAR(2),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  price DECIMAL(10,2),
  currency TEXT,
  distance_km DOUBLE PRECISION,
  vendor_name TEXT,
  vendor_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as listing_id,
    l.title,
    l.description,
    l.location,
    l.city,
    l.state_province,
    l.country_code,
    l.latitude,
    l.longitude,
    l.price,
    l.currency,
    calculate_distance_km(user_lat, user_lon, l.latitude, l.longitude) as distance_km,
    v.business_name as vendor_name,
    v.is_verified as vendor_verified
  FROM public.listings l
  JOIN public.vendors v ON l.vendor_id = v.id
  WHERE l.is_active = true
    AND l.latitude IS NOT NULL 
    AND l.longitude IS NOT NULL
    AND calculate_distance_km(user_lat, user_lon, l.latitude, l.longitude) <= radius_km
    AND (service_type_filter IS NULL OR l.service_type::text = service_type_filter)
    AND (country_filter IS NULL OR l.country_code = country_filter)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get location statistics
CREATE OR REPLACE FUNCTION get_location_stats(
  country_code_filter TEXT DEFAULT NULL,
  state_province_filter TEXT DEFAULT NULL,
  city_filter TEXT DEFAULT NULL
) RETURNS TABLE (
  total_listings BIGINT,
  total_vendors BIGINT,
  countries_count BIGINT,
  states_count BIGINT,
  cities_count BIGINT,
  avg_price DECIMAL(10,2),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT l.id) as total_listings,
    COUNT(DISTINCT v.id) as total_vendors,
    COUNT(DISTINCT l.country_code) as countries_count,
    COUNT(DISTINCT l.state_province) as states_count,
    COUNT(DISTINCT l.city) as cities_count,
    AVG(l.price) as avg_price,
    MIN(l.price) as min_price,
    MAX(l.price) as max_price
  FROM public.listings l
  JOIN public.vendors v ON l.vendor_id = v.id
  WHERE l.is_active = true
    AND (country_code_filter IS NULL OR l.country_code = country_code_filter)
    AND (state_province_filter IS NULL OR l.state_province = state_province_filter)
    AND (city_filter IS NULL OR l.city = city_filter);
END;
$$ LANGUAGE plpgsql;

-- Create function to get popular locations
CREATE OR REPLACE FUNCTION get_popular_locations(
  limit_count INTEGER DEFAULT 20
) RETURNS TABLE (
  country_code VARCHAR(2),
  state_province TEXT,
  city TEXT,
  listings_count BIGINT,
  vendors_count BIGINT,
  avg_price DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.country_code,
    l.state_province,
    l.city,
    COUNT(DISTINCT l.id) as listings_count,
    COUNT(DISTINCT v.id) as vendors_count,
    AVG(l.price) as avg_price
  FROM public.listings l
  JOIN public.vendors v ON l.vendor_id = v.id
  WHERE l.is_active = true
    AND l.country_code IS NOT NULL
    AND l.state_province IS NOT NULL
    AND l.city IS NOT NULL
  GROUP BY l.country_code, l.state_province, l.city
  ORDER BY listings_count DESC, vendors_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate and geocode location
CREATE OR REPLACE FUNCTION validate_location(
  location_text TEXT,
  latitude DOUBLE PRECISION DEFAULT NULL,
  longitude DOUBLE PRECISION DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Basic validation: location text should not be empty
  IF location_text IS NULL OR TRIM(location_text) = '' THEN
    RETURN FALSE;
  END IF;
  
  -- If coordinates provided, validate they are within reasonable bounds
  IF latitude IS NOT NULL AND longitude IS NOT NULL THEN
    IF latitude < -90 OR latitude > 90 OR longitude < -180 OR longitude > 180 THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_distance_km IS 'Calculates distance between two geographic points using Haversine formula';
COMMENT ON FUNCTION find_listings_near_location IS 'Finds active listings within specified radius from user location';
COMMENT ON FUNCTION get_location_stats IS 'Returns statistics about listings and vendors in specified location';
COMMENT ON FUNCTION get_popular_locations IS 'Returns most popular locations by listing and vendor count';
COMMENT ON FUNCTION validate_location IS 'Validates location data for listings and vendors';

-- Update existing listings to populate new location fields from existing location text
-- This is a basic migration - vendors should update their listings with proper location data
UPDATE public.listings 
SET 
  country_code = CASE 
    WHEN location ILIKE '%nigeria%' OR location ILIKE '%ng%' THEN 'NG'
    WHEN location ILIKE '%uganda%' OR location ILIKE '%ug%' THEN 'UG'
    WHEN location ILIKE '%kenya%' OR location ILIKE '%ke%' THEN 'KE'
    WHEN location ILIKE '%ghana%' OR location ILIKE '%gh%' THEN 'GH'
    WHEN location ILIKE '%south africa%' OR location ILIKE '%za%' THEN 'ZA'
    WHEN location ILIKE '%united states%' OR location ILIKE '%usa%' OR location ILIKE '%us%' THEN 'US'
    WHEN location ILIKE '%united kingdom%' OR location ILIKE '%uk%' OR location ILIKE '%gb%' THEN 'GB'
    WHEN location ILIKE '%canada%' OR location ILIKE '%ca%' THEN 'CA'
    ELSE 'US' -- Default to US for now
  END,
  city = CASE 
    WHEN location ILIKE '%lagos%' THEN 'Lagos'
    WHEN location ILIKE '%abuja%' THEN 'Abuja'
    WHEN location ILIKE '%kampala%' THEN 'Kampala'
    WHEN location ILIKE '%nairobi%' THEN 'Nairobi'
    WHEN location ILIKE '%accra%' THEN 'Accra'
    WHEN location ILIKE '%johannesburg%' THEN 'Johannesburg'
    WHEN location ILIKE '%cape town%' THEN 'Cape Town'
    WHEN location ILIKE '%new york%' THEN 'New York'
    WHEN location ILIKE '%london%' THEN 'London'
    WHEN location ILIKE '%toronto%' THEN 'Toronto'
    ELSE SPLIT_PART(location, ',', 1) -- Take first part as city
  END
WHERE country_code IS NULL OR city IS NULL;

-- Update vendors table with jurisdiction information
UPDATE public.vendors 
SET 
  country_code = jurisdiction,
  city = CASE 
    WHEN jurisdiction = 'NG' THEN 'Lagos'
    WHEN jurisdiction = 'UG' THEN 'Kampala'
    WHEN jurisdiction = 'KE' THEN 'Nairobi'
    WHEN jurisdiction = 'GH' THEN 'Accra'
    WHEN jurisdiction = 'ZA' THEN 'Johannesburg'
    WHEN jurisdiction = 'US' THEN 'New York'
    WHEN jurisdiction = 'GB' THEN 'London'
    WHEN jurisdiction = 'CA' THEN 'Toronto'
    ELSE 'Unknown'
  END
WHERE country_code IS NULL AND jurisdiction IS NOT NULL;

-- Create RLS policies for location-based queries
-- Allow public access to location-based functions
CREATE POLICY "Public can view location stats" ON public.listings FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view vendor locations" ON public.vendors FOR SELECT USING (true);

-- Add location verification trigger
CREATE OR REPLACE FUNCTION update_location_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark location as verified if coordinates are provided
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location_verified := TRUE;
    NEW.location_verified_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_verification
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION update_location_verification();

-- Add vendor location verification trigger
CREATE OR REPLACE FUNCTION update_vendor_location_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vendor jurisdiction based on country code
  IF NEW.country_code IS NOT NULL AND NEW.jurisdiction IS NULL THEN
    NEW.jurisdiction := NEW.country_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_location_verification
  BEFORE INSERT OR UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_location_verification();
