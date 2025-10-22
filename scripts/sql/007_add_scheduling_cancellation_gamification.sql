-- Add scheduling and cancellation fields to listings
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS available_dates DATE[],
ADD COLUMN IF NOT EXISTS available_times TEXT[],
ADD COLUMN IF NOT EXISTS cancellation_days INTEGER CHECK (cancellation_days >= 0 AND cancellation_days <= 15);

-- Create Unila Miles table
CREATE TABLE IF NOT EXISTS public.unila_miles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  miles INTEGER NOT NULL DEFAULT 0,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL AND vendor_id IS NULL) OR (user_id IS NULL AND vendor_id IS NOT NULL))
);

-- Create Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  miles_threshold INTEGER NOT NULL,
  badge_icon TEXT,
  badge_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create User Badges table (tracks awarded badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_by UUID REFERENCES public.profiles(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL AND vendor_id IS NULL) OR (user_id IS NULL AND vendor_id IS NOT NULL))
);

-- Enable RLS
ALTER TABLE public.unila_miles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Unila Miles policies
CREATE POLICY "Users can view their own miles"
  ON public.unila_miles FOR SELECT
  USING (user_id = auth.uid() OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

CREATE POLICY "System can create miles"
  ON public.unila_miles FOR INSERT
  WITH CHECK (true);

-- Badges policies
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.badges FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- User Badges policies
CREATE POLICY "Users can view their badges"
  ON public.user_badges FOR SELECT
  USING (user_id = auth.uid() OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can award badges to users"
  ON public.user_badges FOR INSERT
  WITH CHECK (awarded_by = auth.uid() AND vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can award badges"
  ON public.user_badges FOR INSERT
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Create indexes
CREATE INDEX idx_unila_miles_user_id ON public.unila_miles(user_id);
CREATE INDEX idx_unila_miles_vendor_id ON public.unila_miles(vendor_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_vendor_id ON public.user_badges(vendor_id);

-- Insert default badges
INSERT INTO public.badges (name, description, miles_threshold, badge_icon, badge_color) VALUES
('Bronze Explorer', 'Awarded for earning 100 Unila Miles', 100, '🥉', '#CD7F32'),
('Silver Traveler', 'Awarded for earning 500 Unila Miles', 500, '🥈', '#C0C0C0'),
('Gold Adventurer', 'Awarded for earning 1000 Unila Miles', 1000, '🥇', '#FFD700'),
('Platinum Elite', 'Awarded for earning 5000 Unila Miles', 5000, '💎', '#E5E4E2'),
('Diamond Legend', 'Awarded for earning 10000 Unila Miles', 10000, '💠', '#B9F2FF')
ON CONFLICT (name) DO NOTHING;

-- Function to award miles for activities
CREATE OR REPLACE FUNCTION award_miles_for_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 10 miles to user for making a booking
  INSERT INTO public.unila_miles (user_id, miles, activity_type, activity_description)
  VALUES (NEW.user_id, 10, 'booking', 'Booking created');
  
  -- Award 5 miles to vendor for receiving a booking
  INSERT INTO public.unila_miles (vendor_id, miles, activity_type, activity_description)
  VALUES (NEW.vendor_id, 5, 'booking_received', 'Booking received');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking miles
DROP TRIGGER IF EXISTS trigger_award_miles_booking ON public.bookings;
CREATE TRIGGER trigger_award_miles_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_miles_for_booking();

-- Function to award miles for listing creation
CREATE OR REPLACE FUNCTION award_miles_for_listing()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 20 miles to vendor for creating a listing
  INSERT INTO public.unila_miles (vendor_id, miles, activity_type, activity_description)
  VALUES (NEW.vendor_id, 20, 'listing_created', 'Listing created');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for listing miles
DROP TRIGGER IF EXISTS trigger_award_miles_listing ON public.listings;
CREATE TRIGGER trigger_award_miles_listing
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION award_miles_for_listing();
