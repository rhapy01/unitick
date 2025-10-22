-- Add notification archiving system
-- Automatically archive old notifications to keep the main table clean

-- Add archived_at column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Create index for archived notifications
CREATE INDEX IF NOT EXISTS idx_notifications_archived_at 
ON public.notifications(archived_at);

-- Function to archive old notifications
CREATE OR REPLACE FUNCTION archive_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Archive notifications older than specified days that are read
  UPDATE public.notifications 
  SET archived_at = NOW()
  WHERE 
    archived_at IS NULL 
    AND is_read = TRUE 
    AND created_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Log the archiving
  INSERT INTO public.notification_archive_log (action, count, details)
  VALUES ('archive', archived_count, format('Archived %s notifications older than %s days', archived_count, days_old));
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notifications (including archived ones)
CREATE OR REPLACE FUNCTION get_user_notifications_with_archive(
  user_uuid UUID,
  include_archived BOOLEAN DEFAULT FALSE,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type notification_type,
  priority notification_priority,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN,
  is_email_sent BOOLEAN,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.type,
    n.priority,
    n.title,
    n.message,
    n.data,
    n.is_read,
    n.is_email_sent,
    n.email_sent_at,
    n.created_at,
    n.updated_at,
    n.archived_at
  FROM public.notifications n
  WHERE 
    n.user_id = user_uuid
    AND (include_archived = TRUE OR n.archived_at IS NULL)
  ORDER BY n.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete very old archived notifications
CREATE OR REPLACE FUNCTION cleanup_old_archived_notifications(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete archived notifications older than specified days
  DELETE FROM public.notifications 
  WHERE 
    archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  INSERT INTO public.notification_archive_log (action, count, details)
  VALUES ('cleanup', deleted_count, format('Deleted %s archived notifications older than %s days', deleted_count, days_old));
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create archive log table for tracking
CREATE TABLE IF NOT EXISTS public.notification_archive_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL, -- 'archive' or 'cleanup'
  count INTEGER NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for archive log
CREATE INDEX IF NOT EXISTS idx_notification_archive_log_created_at 
ON public.notification_archive_log(created_at DESC);

-- Enable RLS on archive log (admin only)
ALTER TABLE public.notification_archive_log ENABLE ROW LEVEL SECURITY;

-- Only system can access archive log
CREATE POLICY "System can access archive log"
  ON public.notification_archive_log FOR ALL
  USING (true);

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats(user_uuid UUID)
RETURNS TABLE (
  total_notifications BIGINT,
  unread_notifications BIGINT,
  archived_notifications BIGINT,
  notifications_this_week BIGINT,
  notifications_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.notifications WHERE user_id = user_uuid AND archived_at IS NULL) as total_notifications,
    (SELECT COUNT(*) FROM public.notifications WHERE user_id = user_uuid AND is_read = FALSE AND archived_at IS NULL) as unread_notifications,
    (SELECT COUNT(*) FROM public.notifications WHERE user_id = user_uuid AND archived_at IS NOT NULL) as archived_notifications,
    (SELECT COUNT(*) FROM public.notifications WHERE user_id = user_uuid AND created_at >= NOW() - INTERVAL '7 days' AND archived_at IS NULL) as notifications_this_week,
    (SELECT COUNT(*) FROM public.notifications WHERE user_id = user_uuid AND created_at >= NOW() - INTERVAL '30 days' AND archived_at IS NULL) as notifications_this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION archive_old_notifications IS 'Archive old read notifications to keep main table clean';
COMMENT ON FUNCTION get_user_notifications_with_archive IS 'Get user notifications with optional archived ones';
COMMENT ON FUNCTION cleanup_old_archived_notifications IS 'Permanently delete very old archived notifications';
COMMENT ON FUNCTION get_notification_stats IS 'Get notification statistics for a user';
