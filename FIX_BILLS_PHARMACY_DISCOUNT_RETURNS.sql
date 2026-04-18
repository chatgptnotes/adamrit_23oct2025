ALTER TABLE bills ADD COLUMN IF NOT EXISTS visit_id TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_patient_data JSONB DEFAULT '{}';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_items_json JSONB;

CREATE INDEX IF NOT EXISTS idx_bills_visit_id ON bills(visit_id);

ALTER TABLE visit_discounts ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_approval';
ALTER TABLE visit_discounts ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE visit_discounts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE visit_discounts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE medicine_returns ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
