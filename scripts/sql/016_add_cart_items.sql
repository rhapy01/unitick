-- Cart items table for server-side cart
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  booking_date TIMESTAMPTZ,
  is_gift BOOLEAN NOT NULL DEFAULT FALSE,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id, booking_date)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own cart items"
  ON public.cart_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cart items"
  ON public.cart_items FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own cart items"
  ON public.cart_items FOR DELETE
  USING (user_id = auth.uid());

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_listing_id ON public.cart_items(listing_id);
