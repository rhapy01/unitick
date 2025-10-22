-- Add wallet columns back to profiles table
-- This is needed after the cleanup

BEGIN;

-- Add wallet columns back
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_encrypted_private_key TEXT,
ADD COLUMN IF NOT EXISTS wallet_encrypted_mnemonic TEXT,
ADD COLUMN IF NOT EXISTS wallet_encryption_iv TEXT,
ADD COLUMN IF NOT EXISTS wallet_encryption_auth_tag TEXT,
ADD COLUMN IF NOT EXISTS wallet_encryption_salt TEXT,
ADD COLUMN IF NOT EXISTS wallet_connected_at TIMESTAMPTZ;

-- Add indexes for wallet data
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address 
ON public.profiles(wallet_address) 
WHERE wallet_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_encrypted_wallet 
ON public.profiles(wallet_encrypted_private_key) 
WHERE wallet_encrypted_private_key IS NOT NULL;

COMMIT;

-- Verify the columns were added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'wallet%'
ORDER BY column_name;
