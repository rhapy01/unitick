-- Add total_tickets and require capacity for listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS total_tickets INTEGER;

-- Backfill total_tickets from capacity where missing
UPDATE public.listings
SET total_tickets = COALESCE(total_tickets, capacity)
WHERE total_tickets IS NULL;

-- Ensure non-null and positive constraints
ALTER TABLE public.listings
  ALTER COLUMN capacity SET NOT NULL,
  ALTER COLUMN total_tickets SET NOT NULL;

ALTER TABLE public.listings
  ADD CONSTRAINT check_capacity_positive CHECK (capacity > 0),
  ADD CONSTRAINT check_total_tickets_positive CHECK (total_tickets > 0);

-- Optional: total_tickets cannot exceed capacity
ALTER TABLE public.listings
  ADD CONSTRAINT check_tickets_le_capacity CHECK (total_tickets <= capacity);

