-- Add scan_center column to external_requisitions table
-- Stores the scan/diagnostic center associated with the external requisition

ALTER TABLE public.external_requisitions
  ADD COLUMN IF NOT EXISTS scan_center VARCHAR(100);

COMMENT ON COLUMN public.external_requisitions.scan_center IS
  'Scan/diagnostic center for this external requisition (e.g., Biviji Scan, Helix Scan, Nobel Scan, Orange Scan, Insight Scan, Galaxy Scan)';

CREATE INDEX IF NOT EXISTS idx_external_requisitions_scan_center
  ON public.external_requisitions(scan_center);
