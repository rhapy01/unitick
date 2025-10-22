-- Vendor review replies table to support vendor responses to feedback
CREATE TABLE IF NOT EXISTS vendor_review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES vendor_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reply TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_review_replies_vendor_id ON vendor_review_replies(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_review_replies_review_id ON vendor_review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_vendor_review_replies_user_id ON vendor_review_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_review_replies_created_at ON vendor_review_replies(created_at DESC);

-- Enable RLS
ALTER TABLE vendor_review_replies ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read, vendor owner can reply, and repliers can manage their own
CREATE POLICY "Anyone can view vendor review replies" ON vendor_review_replies FOR SELECT USING (true);

-- Allow insert only if the user owns the vendor OR is the original reviewer (optional: just vendor owner)
-- Here we restrict to vendor owner only
CREATE POLICY "Vendor owner can insert replies" ON vendor_review_replies FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
);

-- Allow update/delete of reply only by the author of the reply
CREATE POLICY "Reply author can update replies" ON vendor_review_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Reply author can delete replies" ON vendor_review_replies FOR DELETE USING (auth.uid() = user_id);


