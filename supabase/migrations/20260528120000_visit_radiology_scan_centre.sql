-- Add scan_centre column to visit_radiology so the External Requisition selector
-- in the Final Bill Radiology tab can persist which external scan centre (e.g.
-- Biviji, Helix, Nobel, Orange, Insight, Galaxy) was chosen for each test.

ALTER TABLE public.visit_radiology
  ADD COLUMN IF NOT EXISTS external_requisition TEXT;

COMMENT ON COLUMN public.visit_radiology.external_requisition IS
  'Name of the external scan centre selected on the Final Bill Radiology tab (nullable for in-house tests).';

CREATE INDEX IF NOT EXISTS idx_visit_radiology_external_requisition
  ON public.visit_radiology(external_requisition);
