-- Test script to verify gift fields exist in bookings table
-- Run this to check if the migration was applied correctly

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('recipient_name', 'recipient_email', 'recipient_wallet', 'gift_message', 'is_gift')
ORDER BY column_name;
