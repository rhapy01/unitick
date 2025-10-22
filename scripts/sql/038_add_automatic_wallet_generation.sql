-- Add automatic wallet generation during user signup
-- Migration: 038_add_automatic_wallet_generation.sql

BEGIN;

-- Add function to generate deterministic wallet address from user data
CREATE OR REPLACE FUNCTION generate_wallet_address(user_email TEXT, user_password_hash TEXT)
RETURNS TEXT AS $$
DECLARE
  wallet_address TEXT;
  seed_hash TEXT;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  -- Generate deterministic seed from email and password hash
  seed_hash := encode(digest(user_email || user_password_hash, 'sha256'), 'hex');
  
  -- Generate wallet address using first 40 characters of hash
  wallet_address := '0x' || substring(seed_hash, 1, 40);
  
  -- Ensure address is unique (basic check)
  WHILE EXISTS (SELECT 1 FROM profiles WHERE wallet_address = wallet_address) AND attempt_count < max_attempts LOOP
    attempt_count := attempt_count + 1;
    -- Modify seed slightly for uniqueness
    seed_hash := encode(digest(user_email || user_password_hash || attempt_count::text, 'sha256'), 'hex');
    wallet_address := '0x' || substring(seed_hash, 1, 40);
  END LOOP;
  
  -- If still not unique after max attempts, generate random
  IF EXISTS (SELECT 1 FROM profiles WHERE wallet_address = wallet_address) THEN
    -- Generate random address as fallback
    wallet_address := '0x' || substring(encode(gen_random_bytes(20), 'hex'), 1, 40);
  END IF;
  
  RETURN wallet_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the profile creation trigger to include automatic wallet generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_wallet_address TEXT;
BEGIN
  -- Generate wallet address for the new user
  -- Note: We use a placeholder for password hash since we don't have access to it in the trigger
  -- In a real implementation, you might want to pass this differently
  generated_wallet_address := generate_wallet_address(
    new.email, 
    encode(digest(new.id::text || new.email, 'sha256'), 'hex')
  );
  
  INSERT INTO public.profiles (id, email, full_name, role, wallet_address, wallet_connected_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'user'),
    generated_wallet_address,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Add function to regenerate wallet for existing users (optional utility)
CREATE OR REPLACE FUNCTION regenerate_user_wallet(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  user_password_hash TEXT;
  new_wallet_address TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM profiles WHERE id = user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Generate new wallet address
  user_password_hash := encode(digest(user_id::text || user_email, 'sha256'), 'hex');
  new_wallet_address := generate_wallet_address(user_email, user_password_hash);
  
  -- Update user's wallet address
  UPDATE profiles 
  SET 
    wallet_address = new_wallet_address,
    wallet_connected_at = NOW()
  WHERE id = user_id;
  
  RETURN new_wallet_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to check if user has auto-generated wallet
CREATE OR REPLACE FUNCTION is_auto_generated_wallet(wallet_addr TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if wallet address follows our generation pattern
  -- This is a simple heuristic - in production you might want more sophisticated detection
  RETURN wallet_addr ~ '^0x[a-f0-9]{40}$';
END;
$$ LANGUAGE plpgsql;

COMMIT;
