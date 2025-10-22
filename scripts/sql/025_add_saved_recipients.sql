-- Add saved recipients table for user profile
-- This allows users to save recipient details for easy gift purchases

CREATE TABLE IF NOT EXISTS public.saved_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate recipients per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_recipients_user_email 
ON public.saved_recipients(user_id, email);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_recipients_user_id 
ON public.saved_recipients(user_id);

-- Enable RLS
ALTER TABLE public.saved_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved recipients"
  ON public.saved_recipients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own saved recipients"
  ON public.saved_recipients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own saved recipients"
  ON public.saved_recipients FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own saved recipients"
  ON public.saved_recipients FOR DELETE
  USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE public.saved_recipients IS 'Saved recipient details for easy gift purchases';
