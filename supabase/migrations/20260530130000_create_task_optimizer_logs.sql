-- Staff daily task logs + AI reduction/automation suggestions.
-- Captured per submission so we can later analyse, per person and per role,
-- what staff do day-to-day and which tasks are good automation candidates.
CREATE TABLE IF NOT EXISTS public.task_optimizer_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email     text NOT NULL,
  hospital_type  text,
  staff_name     text NOT NULL,
  designation    text NOT NULL,
  log_date       date NOT NULL DEFAULT CURRENT_DATE,
  tasks          jsonb NOT NULL,          -- string[] of raw task descriptions
  ai_suggestions jsonb,                   -- TaskSuggestion[] returned by Gemini
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_optimizer_logs_email
  ON public.task_optimizer_logs (user_email);
CREATE INDEX IF NOT EXISTS idx_task_optimizer_logs_hospital
  ON public.task_optimizer_logs (hospital_type);

COMMENT ON TABLE public.task_optimizer_logs IS
  'Staff daily task logs + AI reduction/automation suggestions for productivity analysis.';

-- The app talks to Supabase with the anon key from the browser (custom auth),
-- as most tables here do. Keep RLS disabled so anon can read/write/update,
-- matching the app's dominant pattern. (Explicit in case the table was first
-- created via the dashboard, which enables RLS by default.)
ALTER TABLE public.task_optimizer_logs DISABLE ROW LEVEL SECURITY;
