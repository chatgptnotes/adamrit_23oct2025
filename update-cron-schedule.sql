-- Update the cron job schedule from 10:00 AM to 9:00 AM IST
-- First, unschedule the existing job
SELECT cron.unschedule('send-admission-reminders-daily');

-- Then reschedule it with the new time (9:00 AM IST = 3:30 AM UTC)
SELECT cron.schedule(
    'send-admission-reminders-daily',
    '30 3 * * *', -- Every day at 3:30 AM UTC (9:00 AM IST)
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

-- Verify the update
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'send-admission-reminders-daily';
