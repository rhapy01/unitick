-- Fix vendor category constraint to allow minimum 1 category instead of exactly 2
-- Migration: 999_fix_category_constraint.sql

BEGIN;

-- Drop the old constraint that required exactly 2 categories
ALTER TABLE public.vendors
DROP CONSTRAINT IF EXISTS vendors_categories_count;

-- Add new constraint to require at least 1 category
ALTER TABLE public.vendors
ADD CONSTRAINT vendors_categories_count CHECK (array_length(categories, 1) >= 1);

COMMIT;

