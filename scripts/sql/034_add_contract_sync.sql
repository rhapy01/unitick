-- Create sync status table to track contract event processing
CREATE TABLE IF NOT EXISTS public.sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_address TEXT NOT NULL UNIQUE,
  last_block TEXT NOT NULL DEFAULT '0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read sync status
CREATE POLICY "Allow authenticated users to read sync status" ON public.sync_status
  FOR SELECT TO authenticated
  USING (true);

-- Create policy for service role to manage sync status
CREATE POLICY "Allow service role to manage sync status" ON public.sync_status
  FOR ALL TO service_role
  USING (true);
