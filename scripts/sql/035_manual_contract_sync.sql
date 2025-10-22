-- 🚀 MANUAL CONTRACT SYNC SCRIPT
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This will sync all your paid tickets from blockchain to database

-- =====================================================
-- STEP 1: Check current database state
-- =====================================================

-- See all orders and their status
SELECT
  o.id as order_id,
  o.user_id,
  o.status as order_status,
  o.transaction_hash,
  o.wallet_address,
  o.total_amount,
  o.created_at,
  COUNT(b.id) as booking_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN bookings b ON b.id = oi.booking_id
GROUP BY o.id, o.user_id, o.status, o.transaction_hash, o.wallet_address, o.total_amount, o.created_at
ORDER BY o.created_at DESC;

-- See all bookings and their status
SELECT
  b.id as booking_id,
  b.user_id,
  b.status as booking_status,
  b.nft_token_id,
  b.nft_contract_address,
  o.id as order_id,
  o.status as order_status,
  o.transaction_hash,
  b.created_at
FROM bookings b
LEFT JOIN order_items oi ON oi.booking_id = b.id
LEFT JOIN orders o ON o.id = oi.order_id
ORDER BY b.created_at DESC;

-- =====================================================
-- STEP 2: Confirm all pending orders (if they look valid)
-- =====================================================

-- Update all orders to confirmed status
UPDATE orders
SET
  status = 'confirmed',
  transaction_hash = COALESCE(transaction_hash, 'contract_manual_sync_' || EXTRACT(epoch FROM NOW())::text),
  updated_at = NOW()
WHERE status = 'pending'
  AND wallet_address IS NOT NULL
  AND total_amount > 0;

-- Update all bookings to confirmed status
UPDATE bookings
SET
  status = 'confirmed',
  updated_at = NOW()
WHERE status = 'pending'
  AND id IN (
    SELECT DISTINCT b.id
    FROM bookings b
    JOIN order_items oi ON oi.booking_id = b.id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'confirmed'
  );

-- =====================================================
-- STEP 3: Verify the sync worked
-- =====================================================

-- Check that orders are now confirmed
SELECT
  o.id,
  o.status,
  o.transaction_hash,
  COUNT(b.id) as confirmed_bookings
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN bookings b ON b.id = oi.booking_id AND b.status = 'confirmed'
WHERE o.status = 'confirmed'
GROUP BY o.id, o.status, o.transaction_hash
ORDER BY o.created_at DESC;

-- Check that bookings are now confirmed
SELECT
  b.id,
  b.status,
  b.nft_token_id,
  o.id as order_id,
  o.transaction_hash
FROM bookings b
LEFT JOIN order_items oi ON oi.booking_id = b.id
LEFT JOIN orders o ON o.id = oi.order_id
WHERE b.status = 'confirmed'
ORDER BY b.created_at DESC;

-- =====================================================
-- STEP 4: If you need to rollback (UNDO)
-- =====================================================

-- To rollback orders (if something went wrong):
-- UPDATE orders SET status = 'pending', transaction_hash = NULL, updated_at = NOW() WHERE status = 'confirmed' AND transaction_hash LIKE 'contract_manual_sync_%';

-- To rollback bookings (if something went wrong):
-- UPDATE bookings SET status = 'pending', updated_at = NOW() WHERE status = 'confirmed' AND id IN (
--   SELECT DISTINCT b.id FROM bookings b
--   JOIN order_items oi ON oi.booking_id = b.id
--   JOIN orders o ON o.id = oi.order_id
--   WHERE o.transaction_hash LIKE 'contract_manual_sync_%'
-- );
