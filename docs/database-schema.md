-- Database Schema for User Roles and Vendor Management
-- This shows the structure of the tables involved in user/vendor role management

-- 1. USER_ROLE ENUM TYPE
-- This defines the possible user roles
CREATE TYPE user_role AS ENUM ('user', 'vendor', 'admin');

-- 2. PROFILES TABLE
-- This extends the auth.users table with additional profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',  -- This is the key field for role management
  wallet_address TEXT,
  wallet_salt TEXT,
  wallet_connected_at TIMESTAMPTZ,
  wallet_consistency_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. VENDORS TABLE
-- This contains business information for users who are vendors
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  wallet_address TEXT NOT NULL,
  jurisdiction TEXT,
  categories service_type[],
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT DEFAULT 'none',
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  company_name TEXT,
  physical_address TEXT,
  business_registration_number TEXT,
  logo_url TEXT,
  banner_url TEXT,
  categories_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)  -- Each user can only have one vendor profile
);

-- 4. PROFILE CREATION TRIGGER
-- This automatically creates a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_wallet RECORD;
BEGIN
  -- Generate consistent wallet for the new user
  SELECT wallet_address, wallet_salt INTO generated_wallet 
  FROM generate_consistent_wallet_address(
    new.id, 
    new.email, 
    encode(digest(new.id::text || new.email, 'sha256'), 'hex')
  );
  
  INSERT INTO public.profiles (id, email, full_name, role, wallet_address, wallet_salt, wallet_connected_at, wallet_consistency_checked_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'user'),  -- Extract role from signup data
    generated_wallet.wallet_address,
    generated_wallet.wallet_salt,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- 5. KEY RELATIONSHIPS
-- profiles.role = 'user' -> User can book services
-- profiles.role = 'vendor' -> User can create vendor profile and list services
-- profiles.role = 'admin' -> User has admin access

-- 6. POTENTIAL ISSUES TO CHECK FOR:
-- - Users with role='user' but have vendor profiles (security issue)
-- - Users with role='vendor' but no vendor profiles (incomplete setup)
-- - Multiple vendor profiles for same user (data integrity issue)
