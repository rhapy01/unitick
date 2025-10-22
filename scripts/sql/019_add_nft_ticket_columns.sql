-- Add NFT reference columns for on-chain ticketing
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS nft_contract_address TEXT,
ADD COLUMN IF NOT EXISTS nft_token_id TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS nft_batch_contract_address TEXT,
ADD COLUMN IF NOT EXISTS nft_batch_id TEXT;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_bookings_nft ON bookings(nft_contract_address, nft_token_id);
CREATE INDEX IF NOT EXISTS idx_orders_nft ON orders(nft_batch_contract_address, nft_batch_id);


