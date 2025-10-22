-- Fix wallet address mismatch for akintoyeisaac5@gmail.com
-- Run this in your Supabase SQL Editor

UPDATE profiles 
SET wallet_address = '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88'
WHERE email = 'akintoyeisaac5@gmail.com';

-- Verify the update
SELECT email, wallet_address 
FROM profiles 
WHERE email = 'akintoyeisaac5@gmail.com';
