-- Add missing gift fields to bookings table
-- These fields are needed for proper gift ticket functionality

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS recipient_wallet TEXT,
ADD COLUMN IF NOT EXISTS gift_message TEXT;

-- Add comments to explain the fields
COMMENT ON COLUMN public.bookings.recipient_wallet IS 'Crypto wallet address where the NFT ticket will be minted for gift recipients';
COMMENT ON COLUMN public.bookings.gift_message IS 'Personal message from buyer to recipient for gift purchases';

-- Create index for gift bookings lookup
CREATE INDEX IF NOT EXISTS idx_bookings_is_gift ON public.bookings(is_gift);
CREATE INDEX IF NOT EXISTS idx_bookings_recipient_email ON public.bookings(recipient_email);
