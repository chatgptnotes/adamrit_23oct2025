-- Tie each automation to a staff role/persona so the Automations list can be
-- grouped per role and the AI assistant can auto-fill who a flow is for.
ALTER TABLE public.task_optimizer_flows
  ADD COLUMN IF NOT EXISTS role text;

CREATE INDEX IF NOT EXISTS idx_task_optimizer_flows_role
  ON public.task_optimizer_flows (role);

COMMENT ON COLUMN public.task_optimizer_flows.role IS
  'Staff role / persona this automation is for (e.g. Nursing, Billing). NULL = all staff.';
