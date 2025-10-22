-- Add verification application fields to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_applied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create vendor_reviews table
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- Made nullable
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
  -- Removed UNIQUE constraint to allow multiple reviews per user
);

-- Create vendor_likes table
CREATE TABLE IF NOT EXISTS vendor_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, user_id)
);

-- Add rating tracking columns to vendors
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS total_rating INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;

-- Enable RLS
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_reviews
CREATE POLICY "Anyone can view reviews" ON vendor_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON vendor_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON vendor_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON vendor_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vendor_likes
CREATE POLICY "Anyone can view likes" ON vendor_likes FOR SELECT USING (true);
CREATE POLICY "Users can create likes" ON vendor_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON vendor_likes FOR DELETE USING (auth.uid() = user_id);

-- Function to update vendor rating and comment stats
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

-- Trigger for review insert/update
CREATE TRIGGER update_vendor_stats_on_review
AFTER INSERT OR UPDATE ON vendor_reviews
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating_stats();

-- Function to update vendor like count
CREATE OR REPLACE FUNCTION update_vendor_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vendors SET like_count = like_count + 1 WHERE id = NEW.vendor_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vendors SET like_count = like_count - 1 WHERE id = OLD.vendor_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like insert/delete
CREATE TRIGGER update_vendor_likes
AFTER INSERT OR DELETE ON vendor_likes
FOR EACH ROW
EXECUTE FUNCTION update_vendor_like_count();
