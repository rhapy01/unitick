-- Database performance optimization
-- This script addresses the N+1 query problems and adds missing indexes

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_status ON public.bookings(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_status ON public.bookings(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_vendor_active ON public.listings(vendor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_listings_service_active ON public.listings(service_type, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON public.vendors(is_verified, is_featured);

-- Add indexes for date-based queries
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);

-- Add indexes for text search
CREATE INDEX IF NOT EXISTS idx_listings_title_search ON public.listings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_listings_description_search ON public.listings USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_vendors_business_name_search ON public.vendors USING gin(to_tsvector('english', business_name));

-- Optimize vendor dashboard queries with materialized views
CREATE MATERIALIZED VIEW IF NOT EXISTS vendor_stats AS
SELECT 
  v.id as vendor_id,
  v.user_id,
  v.business_name,
  v.is_verified,
  v.average_rating,
  v.review_count,
  v.like_count,
  COUNT(b.id) as total_bookings,
  COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.subtotal ELSE 0 END), 0) as total_revenue,
  COUNT(CASE WHEN l.is_active = true THEN 1 END) as active_listings,
  COALESCE(SUM(um.miles), 0) as total_miles
FROM public.vendors v
LEFT JOIN public.listings l ON v.id = l.vendor_id
LEFT JOIN public.bookings b ON l.id = b.listing_id
LEFT JOIN public.unila_miles um ON v.id = um.vendor_id
GROUP BY v.id, v.user_id, v.business_name, v.is_verified, v.average_rating, v.review_count, v.like_count;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_stats_vendor_id ON vendor_stats(vendor_id);

-- Create function to refresh vendor stats
CREATE OR REPLACE FUNCTION refresh_vendor_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY vendor_stats;
END;
$$ LANGUAGE plpgsql;

-- Create function to get vendor dashboard data efficiently
CREATE OR REPLACE FUNCTION get_vendor_dashboard_data(p_user_id UUID)
RETURNS TABLE (
  total_bookings BIGINT,
  total_revenue NUMERIC,
  active_listings BIGINT,
  total_miles INTEGER,
  average_rating NUMERIC,
  total_reviews INTEGER,
  total_likes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vs.total_bookings,
    vs.total_revenue,
    vs.active_listings,
    vs.total_miles::INTEGER,
    vs.average_rating,
    vs.review_count::INTEGER,
    vs.like_count::INTEGER
  FROM vendor_stats vs
  WHERE vs.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get recent bookings for vendor
CREATE OR REPLACE FUNCTION get_vendor_recent_bookings(p_vendor_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  listing_title TEXT,
  total_amount NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    l.title as listing_title,
    b.total_amount,
    b.created_at
  FROM public.bookings b
  JOIN public.listings l ON b.listing_id = l.id
  WHERE b.vendor_id = p_vendor_id
  ORDER BY b.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get top performing listings for vendor
CREATE OR REPLACE FUNCTION get_vendor_top_listings(p_vendor_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  title TEXT,
  bookings_count BIGINT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    COUNT(b.id) as bookings_count,
    COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.subtotal ELSE 0 END), 0) as revenue
  FROM public.listings l
  LEFT JOIN public.bookings b ON l.id = b.listing_id
  WHERE l.vendor_id = p_vendor_id
  GROUP BY l.id, l.title
  ORDER BY bookings_count DESC, revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get vendor badges
CREATE OR REPLACE FUNCTION get_vendor_badges(p_vendor_id UUID)
RETURNS TABLE (
  name TEXT,
  badge_icon TEXT,
  badge_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bg.name,
    bg.badge_icon,
    bg.badge_color
  FROM public.user_badges ub
  JOIN public.badges bg ON ub.badge_id = bg.id
  WHERE ub.vendor_id = p_vendor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to refresh vendor stats when data changes
CREATE OR REPLACE FUNCTION trigger_refresh_vendor_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh stats asynchronously to avoid blocking
  PERFORM pg_notify('refresh_vendor_stats', '');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for vendor stats refresh
DROP TRIGGER IF EXISTS trigger_vendor_stats_bookings ON public.bookings;
CREATE TRIGGER trigger_vendor_stats_bookings
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_vendor_stats();

DROP TRIGGER IF EXISTS trigger_vendor_stats_listings ON public.listings;
CREATE TRIGGER trigger_vendor_stats_listings
  AFTER INSERT OR UPDATE OR DELETE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_vendor_stats();

DROP TRIGGER IF EXISTS trigger_vendor_stats_miles ON public.unila_miles;
CREATE TRIGGER trigger_vendor_stats_miles
  AFTER INSERT OR UPDATE OR DELETE ON public.unila_miles
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_vendor_stats();

-- Add partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed ON public.bookings(vendor_id, created_at DESC) 
WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS idx_listings_active_vendor ON public.listings(vendor_id, created_at DESC) 
WHERE is_active = true;

-- Add indexes for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_order_items_booking_id ON public.order_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_ticket_verifications_order_id ON public.ticket_verifications(order_id);

-- Optimize text search with proper configuration
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON public.listings USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_location_trgm ON public.listings USING gin(location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vendors_business_name_trgm ON public.vendors USING gin(business_name gin_trgm_ops);

-- Add function to search listings efficiently
CREATE OR REPLACE FUNCTION search_listings(
  p_query TEXT,
  p_service_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  vendor_id UUID,
  service_type TEXT,
  title TEXT,
  description TEXT,
  location TEXT,
  price NUMERIC,
  currency TEXT,
  images TEXT[],
  vendor_name TEXT,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.vendor_id,
    l.service_type::TEXT,
    l.title,
    l.description,
    l.location,
    l.price,
    l.currency,
    l.images,
    v.business_name as vendor_name,
    v.is_verified
  FROM public.listings l
  JOIN public.vendors v ON l.vendor_id = v.id
  WHERE l.is_active = true
    AND (p_service_type IS NULL OR l.service_type::TEXT = p_service_type)
    AND (
      l.title ILIKE '%' || p_query || '%' OR
      l.description ILIKE '%' || p_query || '%' OR
      l.location ILIKE '%' || p_query || '%' OR
      v.business_name ILIKE '%' || p_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN l.title ILIKE p_query || '%' THEN 1
      WHEN l.title ILIKE '%' || p_query || '%' THEN 2
      ELSE 3
    END,
    l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_vendor_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_recent_bookings(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_top_listings(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_listings(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT SELECT ON vendor_stats TO authenticated;
