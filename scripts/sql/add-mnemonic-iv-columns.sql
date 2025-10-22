-- Add separate IV and auth tag columns for mnemonic encryption
-- This fixes the critical IV reuse vulnerability

BEGIN;

-- Add new columns for mnemonic-specific encryption
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_mnemonic_iv TEXT,
ADD COLUMN IF NOT EXISTS wallet_mnemonic_auth_tag TEXT;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_profiles_mnemonic_iv ON public.profiles(wallet_mnemonic_iv);
CREATE INDEX IF NOT EXISTS idx_profiles_mnemonic_auth_tag ON public.profiles(wallet_mnemonic_auth_tag);

COMMIT;

-- Verify the new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('wallet_mnemonic_iv', 'wallet_mnemonic_auth_tag');
