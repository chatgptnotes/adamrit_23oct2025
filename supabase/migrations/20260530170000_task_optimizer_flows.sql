-- Visual automation flows for the Task Optimizer ("Jotflow").
-- Each row is one trigger -> condition -> action graph, authored on a React Flow
-- canvas and stored as JSONB. Flows are evaluated client-side when a suggestion's
-- status changes, so staff automations (notify, tag, auto-advance) run from the
-- workflow loop they already use.
CREATE TABLE IF NOT EXISTS public.task_optimizer_flows (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_type  text,
  name           text NOT NULL DEFAULT 'Untitled automation',
  enabled        boolean NOT NULL DEFAULT true,
  nodes          jsonb NOT NULL DEFAULT '[]'::jsonb,  -- React Flow nodes
  edges          jsonb NOT NULL DEFAULT '[]'::jsonb,  -- React Flow edges
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_optimizer_flows_hospital
  ON public.task_optimizer_flows (hospital_type);
CREATE INDEX IF NOT EXISTS idx_task_optimizer_flows_enabled
  ON public.task_optimizer_flows (enabled);

COMMENT ON TABLE public.task_optimizer_flows IS
  'Visual trigger/condition/action automations for the Task Optimizer workflow loop.';

-- Matches the app pattern: browser uses the anon key under custom auth.
ALTER TABLE public.task_optimizer_flows DISABLE ROW LEVEL SECURITY;
