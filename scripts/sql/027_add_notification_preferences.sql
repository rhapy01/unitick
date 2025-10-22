-- Add notification preferences system
-- Users can disable certain types of notifications

-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one preference per user per notification type
  UNIQUE(user_id, notification_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON public.notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_type 
ON public.notification_preferences(notification_type);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notification preferences"
  ON public.notification_preferences FOR DELETE
  USING (user_id = auth.uid());

-- Function to get user notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(user_uuid UUID)
RETURNS TABLE (
  notification_type notification_type,
  email_enabled BOOLEAN,
  in_app_enabled BOOLEAN,
  push_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    np.notification_type,
    COALESCE(np.email_enabled, TRUE) as email_enabled,
    COALESCE(np.in_app_enabled, TRUE) as in_app_enabled,
    COALESCE(np.push_enabled, TRUE) as push_enabled
  FROM (
    SELECT unnest(enum_range(NULL::notification_type)) as notification_type
  ) types
  LEFT JOIN public.notification_preferences np ON 
    types.notification_type = np.notification_type AND np.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update notification preference
CREATE OR REPLACE FUNCTION update_notification_preference(
  user_uuid UUID,
  notif_type notification_type,
  email_enabled BOOLEAN DEFAULT NULL,
  in_app_enabled BOOLEAN DEFAULT NULL,
  push_enabled BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id, notification_type, email_enabled, in_app_enabled, push_enabled)
  VALUES (user_uuid, notif_type, 
    COALESCE(email_enabled, TRUE), 
    COALESCE(in_app_enabled, TRUE), 
    COALESCE(push_enabled, TRUE))
  ON CONFLICT (user_id, notification_type)
  DO UPDATE SET
    email_enabled = COALESCE(update_notification_preference.email_enabled, notification_preferences.email_enabled),
    in_app_enabled = COALESCE(update_notification_preference.in_app_enabled, notification_preferences.in_app_enabled),
    push_enabled = COALESCE(update_notification_preference.push_enabled, notification_preferences.push_enabled),
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE public.notification_preferences IS 'User preferences for different types of notifications';
