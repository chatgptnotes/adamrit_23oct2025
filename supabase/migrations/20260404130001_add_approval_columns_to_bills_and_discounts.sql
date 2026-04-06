-- Add missing columns to bills table for approval workflow
-- The code writes to these columns but they don't exist in the schema

-- Bills: approval-related columns
ALTER TABLE bills ADD COLUMN IF NOT EXISTS visit_id TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS formatted_bill_no TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_patient_data JSONB;

-- Visit_discounts: approval-related columns
ALTER TABLE visit_discounts ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_approval';
ALTER TABLE visit_discounts ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE visit_discounts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE visit_discounts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index for faster approval queries
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_visit_discounts_approval_status ON visit_discounts(approval_status);
