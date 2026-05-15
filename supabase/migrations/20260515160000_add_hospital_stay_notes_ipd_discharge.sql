-- Add missing hospital_stay_notes column to ipd_discharge_summary
-- The IpdDischargeSummary.tsx page writes/reads this column when saving the
-- "Hospital Stay Notes" section, but it was never added to the schema, causing
-- INSERT/UPDATE to fail with: "Could not find the 'hospital_stay_notes' column".

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS hospital_stay_notes TEXT;

COMMENT ON COLUMN ipd_discharge_summary.hospital_stay_notes IS
  'Free-text notes describing the patient''s hospital stay (separate from hospital_course / stay_notes).';
