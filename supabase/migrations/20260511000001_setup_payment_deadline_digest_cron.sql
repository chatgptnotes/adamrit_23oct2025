-- Daily WhatsApp digest of payment deadlines for the Director Dashboard.
-- Runs at 9:00 AM IST (3:30 AM UTC).
--
-- BEFORE THIS WILL WORK, three prerequisites on the DoubleTick / Supabase side:
--
-- 1. Register the WhatsApp template `payment_deadline_digest` (language: en) on
--    DoubleTick with these 6 body placeholders. Example template body:
--
--       Payment Deadline Digest — {{5}}
--       ⚠ {{1}} OVERDUE  |  ⏰ {{2}} due in 7 days
--       Total: ₹{{3}}
--
--       Top items:
--       {{4}}
--
--       Open dashboard: https://adamrit.com/director-dashboard
--       Sent: {{6}}
--
-- 2. Set the function env var DIRECTOR_WHATSAPP_PHONES (comma-separated, e.g.
--    "+919XXXXXXXXX,+919YYYYYYYYY"). Falls back to the existing admin numbers
--    if unset.
--
-- 3. Confirm DOUBLETICK_API_KEY is already set (same key used by
--    send-admission-reminders and send-payment-alerts).
--

CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;

DO $$
BEGIN
    PERFORM cron.unschedule('send-payment-deadline-digest-daily');
EXCEPTION
    WHEN undefined_object THEN NULL;
END
$$;

SELECT cron.schedule(
    'send-payment-deadline-digest-daily',
    '30 3 * * *',
    $$
    SELECT
      net.http_post(
          url := 'https://xvkxccqaopbnkvwgyfjv.supabase.co/functions/v1/send-payment-deadline-digest',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := '{}'::jsonb
      ) as request_id;
    $$
);

-- Verify
SELECT * FROM cron.job WHERE jobname = 'send-payment-deadline-digest-daily';
