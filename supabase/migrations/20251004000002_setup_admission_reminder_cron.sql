-- Set up pg_cron job to send admission reminders daily
-- This will run every day at 9:00 AM IST (3:30 AM UTC)

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Remove existing job if it exists (for idempotency)
DO $$
BEGIN
    PERFORM cron.unschedule('send-admission-reminders-daily');
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Job doesn't exist, that's fine
END
$$;

-- Schedule the job to run every day at 9:00 AM IST (3:30 AM UTC)
-- Adjust the time according to your preference
SELECT cron.schedule(
    'send-admission-reminders-daily', -- Job name
    '30 3 * * *', -- Cron expression: Every day at 3:30 AM UTC (9:00 AM IST)
    $$
    SELECT
      net.http_post(
          url := 'https://xvkxccqaopbnkvwgyfjv.supabase.co/functions/v1/send-admission-reminders',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := '{}'::jsonb
      ) as request_id;
    $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'send-admission-reminders-daily';

-- Add comments
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';

-- Create a view to easily check cron job status
CREATE OR REPLACE VIEW cron_job_status AS
SELECT
    j.jobid,
    j.jobname,
    j.schedule,
    j.active,
    jr.start_time as last_run_start,
    jr.end_time as last_run_end,
    jr.status as last_run_status,
    jr.return_message as last_run_message
FROM cron.job j
LEFT JOIN cron.job_run_details jr ON j.jobid = jr.jobid
WHERE j.jobname = 'send-admission-reminders-daily'
ORDER BY jr.start_time DESC
LIMIT 1;

-- Grant access to view cron status
GRANT SELECT ON cron_job_status TO authenticated;

-- Instructions for viewing cron job status:
-- SELECT * FROM cron_job_status;

-- Instructions for manually triggering the function (for testing):
-- SELECT net.http_post(
--     url := 'https://xvkxccqaopbnkvwgyfjv.supabase.co/functions/v1/send-admission-reminders',
--     headers := jsonb_build_object('Content-Type', 'application/json'),
--     body := '{}'::jsonb
-- );
