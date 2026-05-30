-- Workflow / job-flow loop for the Task Optimizer.
-- Each row tracks ONE AI suggestion through a status lifecycle so staff can act
-- on advice and managers can see follow-through and time saved.
--
-- Lifecycle: suggested -> in_progress -> done | dismissed
CREATE TABLE IF NOT EXISTS public.task_optimizer_actions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id          uuid NOT NULL REFERENCES public.task_optimizer_logs (id) ON DELETE CASCADE,
  hospital_type   text,
  task_text       text NOT NULL,          -- the suggestion's task, copied for stable display
  suggestion_type text NOT NULL,          -- automate | reduce | delegate | keep
  status          text NOT NULL DEFAULT 'suggested',  -- suggested | in_progress | done | dismissed
  owner           text,                   -- who is acting on it (free text / email)
  note            text,                   -- optional progress note
  time_saved_mins integer,               -- est. minutes/day saved once done
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- One action row per (log, task) — re-acting updates the same row.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_task_optimizer_actions_log_task
  ON public.task_optimizer_actions (log_id, task_text);
CREATE INDEX IF NOT EXISTS idx_task_optimizer_actions_hospital
  ON public.task_optimizer_actions (hospital_type);
CREATE INDEX IF NOT EXISTS idx_task_optimizer_actions_status
  ON public.task_optimizer_actions (status);

COMMENT ON TABLE public.task_optimizer_actions IS
  'Status lifecycle for Task Optimizer AI suggestions — the productivity workflow loop.';

-- Matches the app's dominant pattern: browser talks to Supabase with the anon
-- key under custom auth, so RLS stays disabled here too.
ALTER TABLE public.task_optimizer_actions DISABLE ROW LEVEL SECURITY;
