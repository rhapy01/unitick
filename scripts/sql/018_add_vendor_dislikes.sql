-- Add dislikes table to capture thumbs-down without unlike
CREATE TABLE IF NOT EXISTS vendor_dislikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, user_id)
);

-- Enable RLS
ALTER TABLE vendor_dislikes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view dislikes" ON vendor_dislikes FOR SELECT USING (true);
CREATE POLICY "Users can create dislikes" ON vendor_dislikes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own dislikes" ON vendor_dislikes FOR DELETE USING (auth.uid() = user_id);

-- Track dislike_count on vendors (add column if missing)
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0;

-- Trigger to keep dislike_count in sync
CREATE OR REPLACE FUNCTION update_vendor_dislike_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vendors SET dislike_count = dislike_count + 1 WHERE id = NEW.vendor_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vendors SET dislike_count = dislike_count - 1 WHERE id = OLD.vendor_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_dislikes
AFTER INSERT OR DELETE ON vendor_dislikes
FOR EACH ROW
EXECUTE FUNCTION update_vendor_dislike_count();


