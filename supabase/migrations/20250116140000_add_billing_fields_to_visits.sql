-- Add billing fields to visits table
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS sst_treatment TEXT,
ADD COLUMN IF NOT EXISTS intimation_done TEXT,
ADD COLUMN IF NOT EXISTS cghs_code TEXT,
ADD COLUMN IF NOT EXISTS package_amount TEXT,
ADD COLUMN IF NOT EXISTS billing_executive TEXT,
ADD COLUMN IF NOT EXISTS extension_taken TEXT,
ADD COLUMN IF NOT EXISTS delay_waiver_intimation TEXT,
ADD COLUMN IF NOT EXISTS surgical_approval TEXT,
ADD COLUMN IF NOT EXISTS remark1 TEXT,
ADD COLUMN IF NOT EXISTS remark2 TEXT;

-- Add comments for documentation
COMMENT ON COLUMN visits.sst_treatment IS 'SST or Secondary Treatment status';
COMMENT ON COLUMN visits.intimation_done IS 'Intimation Done/Not Done status';
COMMENT ON COLUMN visits.cghs_code IS 'CGHS Code or Unlisted with Approval from ESIC';
COMMENT ON COLUMN visits.package_amount IS 'CGHS Package Amount or Approved Unlisted Amount';
COMMENT ON COLUMN visits.billing_executive IS 'Name of Billing Executive who made the bill';
COMMENT ON COLUMN visits.extension_taken IS 'Extension Taken/Not Taken/Not Required status';
COMMENT ON COLUMN visits.delay_waiver_intimation IS 'Delay Waiver For Intimation/Bill Submission status';
COMMENT ON COLUMN visits.surgical_approval IS 'Surgical/Additional Approval status';
COMMENT ON COLUMN visits.remark1 IS 'First remark field';
COMMENT ON COLUMN visits.remark2 IS 'Second remark field'; 