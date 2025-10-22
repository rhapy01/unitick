-- Add recipient wallet and gift message fields to cart_items table
-- These are needed for the gift configuration feature

ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS recipient_wallet TEXT,
ADD COLUMN IF NOT EXISTS gift_message TEXT;

-- Add comments to explain the fields
COMMENT ON COLUMN public.cart_items.recipient_wallet IS 'Crypto wallet address where the NFT ticket will be minted for gift recipients';
COMMENT ON COLUMN public.cart_items.gift_message IS 'Personal message from buyer to recipient for gift purchases';

