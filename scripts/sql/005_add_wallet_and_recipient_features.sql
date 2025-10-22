-- Add wallet connection tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wallet_connected_at TIMESTAMPTZ;

-- Add recipient information to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles(wallet_address);

-- Update RLS policies to allow users to update their wallet info
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
