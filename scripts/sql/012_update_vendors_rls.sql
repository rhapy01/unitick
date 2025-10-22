-- Update vendors RLS: allow public SELECT on all vendors (not only verified)
-- Safe for read-only browse; write/update policies remain unchanged

-- Drop the old verified-only policy if it exists
DROP POLICY IF EXISTS "Anyone can view active vendors" ON public.vendors;

-- Create a new policy that allows public read access to all vendors
CREATE POLICY "Anyone can view vendors"
  ON public.vendors FOR SELECT
  USING (true);

-- Optional: ensure helpful indexes exist (no-ops if already created)
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON public.vendors(is_verified);
CREATE INDEX IF NOT EXISTS idx_vendors_avg_rating ON public.vendors(average_rating);
CREATE INDEX IF NOT EXISTS idx_vendors_like_count ON public.vendors(like_count);
CREATE INDEX IF NOT EXISTS idx_vendors_review_count ON public.vendors(review_count);