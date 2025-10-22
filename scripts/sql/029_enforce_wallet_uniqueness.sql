-- Enforce wallet address uniqueness to prevent one wallet connecting to multiple accounts
-- Migration: 029_enforce_wallet_uniqueness.sql

BEGIN;

-- Add unique constraint on profiles.wallet_address (excluding NULL values)
-- First, handle any existing duplicates by keeping the most recent connection
WITH duplicates AS (
  SELECT
    wallet_address,
    array_agg(id ORDER BY wallet_connected_at DESC NULLS LAST, created_at DESC) as user_ids
  FROM profiles
  WHERE wallet_address IS NOT NULL
  GROUP BY wallet_address
  HAVING COUNT(*) > 1
),
users_to_nullify AS (
  SELECT unnest(user_ids[2:]) as user_id
  FROM duplicates
)
UPDATE profiles
SET
  wallet_address = NULL,
  wallet_connected_at = NULL
WHERE id IN (SELECT user_id FROM users_to_nullify);

-- Now add the unique constraint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_wallet_address_unique
UNIQUE (wallet_address);

-- Add check constraint to ensure wallet address format
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_wallet_address_format
CHECK (wallet_address IS NULL OR wallet_address ~* '^0x[a-fA-F0-9]{40}$');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address
ON public.profiles(wallet_address)
WHERE wallet_address IS NOT NULL;

-- Add function to check wallet availability before connection
CREATE OR REPLACE FUNCTION check_wallet_availability(wallet_addr TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Return true if wallet is available (not connected to any account)
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE wallet_address = wallet_addr
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get user by wallet address
CREATE OR REPLACE FUNCTION get_user_by_wallet(wallet_addr TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  wallet_connected_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.wallet_connected_at
  FROM profiles p
  WHERE p.wallet_address = wallet_addr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
