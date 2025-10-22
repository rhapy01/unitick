-- Enable pg_cron extension (if not already enabled)
-- This needs to be done by Supabase support or in a custom database

-- Create a cron job to call the expire-listings function daily at 2 AM UTC
SELECT cron.schedule(
    'expire-listings-daily',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/expire-listings',
        headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);

-- Create a cron job to call the cron-sync function daily at 2 AM UTC
SELECT cron.schedule(
    'daily-sync-and-expire',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/cron-sync',
        headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);

-- List all cron jobs
SELECT * FROM cron.job;

-- Remove a cron job if needed
-- SELECT cron.unschedule('expire-listings-daily');














