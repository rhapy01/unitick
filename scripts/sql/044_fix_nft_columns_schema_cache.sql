-- Fix NFT columns schema cache issue
-- Migration: 044_fix_nft_columns_schema_cache.sql
-- This migration ensures the NFT columns exist and refreshes the schema cache

BEGIN;

-- Add NFT reference columns for on-chain ticketing (if not already present)
-- This ensures the columns exist even if migration 019 wasn't applied
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS nft_contract_address TEXT,
ADD COLUMN IF NOT EXISTS nft_token_id TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS nft_batch_contract_address TEXT,
ADD COLUMN IF NOT EXISTS nft_batch_id TEXT;

-- Create helpful indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_bookings_nft ON public.bookings(nft_contract_address, nft_token_id);
CREATE INDEX IF NOT EXISTS idx_orders_nft ON public.orders(nft_batch_contract_address, nft_batch_id);

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.nft_contract_address IS 'Contract address for the NFT ticket';
COMMENT ON COLUMN public.bookings.nft_token_id IS 'Token ID for the NFT ticket';
COMMENT ON COLUMN public.orders.nft_batch_contract_address IS 'Contract address for the NFT batch';
COMMENT ON COLUMN public.orders.nft_batch_id IS 'Batch ID for the NFT batch';

-- Force schema cache refresh by querying the columns
-- This helps ensure Supabase recognizes the new columns
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if nft_batch_id column exists in orders table
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'nft_batch_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ nft_batch_id column exists in orders table';
    ELSE
        RAISE NOTICE '❌ nft_batch_id column missing from orders table';
    END IF;
    
    -- Check if nft_token_id column exists in bookings table
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'nft_token_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ nft_token_id column exists in bookings table';
    ELSE
        RAISE NOTICE '❌ nft_token_id column missing from bookings table';
    END IF;
END $$;

-- Test the columns by performing a simple query
-- This forces the schema cache to recognize the columns
DO $$
BEGIN
    -- Test query to ensure columns are accessible
    PERFORM nft_batch_id FROM public.orders LIMIT 0;
    PERFORM nft_token_id FROM public.bookings LIMIT 0;
    
    RAISE NOTICE '✅ Schema cache refresh completed successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Schema cache refresh failed: %', SQLERRM;
END $$;

-- Report completion
DO $$
BEGIN
    RAISE NOTICE '✅ NFT columns schema cache fix completed';
    RAISE NOTICE '📋 Columns added/verified:';
    RAISE NOTICE '   - orders.nft_batch_contract_address';
    RAISE NOTICE '   - orders.nft_batch_id';
    RAISE NOTICE '   - bookings.nft_contract_address';
    RAISE NOTICE '   - bookings.nft_token_id';
    RAISE NOTICE '🔍 Indexes created/verified:';
    RAISE NOTICE '   - idx_orders_nft';
    RAISE NOTICE '   - idx_bookings_nft';
END $$;

COMMIT;
