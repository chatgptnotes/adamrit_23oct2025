-- ============================================================
-- Tally Missing Tables
-- Creates tally_push_queue, tally_ledger_mapping, tally_cost_centres
-- and adds mapping columns to tally_ledgers
-- ============================================================

-- 1. tally_push_queue: retry queue for failed outward pushes to Tally
CREATE TABLE IF NOT EXISTS tally_push_queue (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  push_type        TEXT NOT NULL,                  -- 'bill', 'payment', 'pharmacy', 'esic_bill', 'insurance_bill', 'insurance_payment'
  push_action      TEXT NOT NULL,                  -- 'create-sales-voucher', 'create-receipt-voucher', 'create-voucher', etc.
  payload          JSONB NOT NULL,                 -- the full data payload to re-send
  reference_id     TEXT,                           -- bill number / receipt number for identification
  status           TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed_permanent
  retry_count      INTEGER NOT NULL DEFAULT 0,
  max_retries      INTEGER NOT NULL DEFAULT 5,
  last_error       TEXT,
  last_retry_at    TIMESTAMP WITH TIME ZONE,
  next_retry_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at     TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tally_push_queue_status      ON tally_push_queue(status);
CREATE INDEX IF NOT EXISTS idx_tally_push_queue_next_retry  ON tally_push_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_tally_push_queue_type        ON tally_push_queue(push_type);

ALTER TABLE tally_push_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_tally_push_queue" ON tally_push_queue FOR ALL USING (auth.role() = 'authenticated');

-- 2. tally_ledger_mapping: maps Adamrit payment modes / service categories to Tally ledger names
CREATE TABLE IF NOT EXISTS tally_ledger_mapping (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adamrit_entity_type  TEXT NOT NULL,   -- 'payment_mode', 'service_category', 'pharmacy', 'department', 'insurance', 'esic_income'
  adamrit_entity_name  TEXT NOT NULL,   -- e.g. 'Cash', 'UPI', 'Hospital Income', 'ESIC IPD'
  tally_ledger_name    TEXT NOT NULL,   -- e.g. 'Cash', 'HDFC Bank', 'Hospital Income'
  tally_group          TEXT,            -- optional: e.g. 'Cash-in-Hand', 'Bank Accounts'
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT tally_ledger_mapping_unique UNIQUE (adamrit_entity_type, adamrit_entity_name)
);

CREATE INDEX IF NOT EXISTS idx_tally_ledger_mapping_type ON tally_ledger_mapping(adamrit_entity_type);
CREATE INDEX IF NOT EXISTS idx_tally_ledger_mapping_active ON tally_ledger_mapping(is_active);

ALTER TABLE tally_ledger_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_tally_ledger_mapping" ON tally_ledger_mapping FOR ALL USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION set_tally_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tally_ledger_mapping_updated_at
  BEFORE UPDATE ON tally_ledger_mapping
  FOR EACH ROW EXECUTE FUNCTION set_tally_mapping_updated_at();

-- 3. tally_cost_centres: cost centres synced from Tally, mappable to Adamrit departments
CREATE TABLE IF NOT EXISTS tally_cost_centres (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT NOT NULL UNIQUE,
  parent                 TEXT,
  category               TEXT,                -- 'department', 'ward', 'doctor'
  tally_guid             TEXT UNIQUE,
  adamrit_department_id  TEXT,               -- linked Adamrit department/ward ID
  last_synced_at         TIMESTAMP WITH TIME ZONE,
  created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tally_cost_centres_guid ON tally_cost_centres(tally_guid);
CREATE INDEX IF NOT EXISTS idx_tally_cost_centres_name ON tally_cost_centres(name);

ALTER TABLE tally_cost_centres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_tally_cost_centres" ON tally_cost_centres FOR ALL USING (auth.role() = 'authenticated');

-- 4. Add mapping columns to tally_ledgers (for the ledger mapping UI)
ALTER TABLE tally_ledgers
  ADD COLUMN IF NOT EXISTS is_mapped            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS adamrit_entity_id    TEXT,
  ADD COLUMN IF NOT EXISTS adamrit_entity_type  TEXT;

-- 5. Seed default ledger mappings (common hospital payment modes)
INSERT INTO tally_ledger_mapping (adamrit_entity_type, adamrit_entity_name, tally_ledger_name, tally_group)
VALUES
  ('payment_mode', 'Cash',          'Cash',           'Cash-in-Hand'),
  ('payment_mode', 'CASH',          'Cash',           'Cash-in-Hand'),
  ('payment_mode', 'Card',          'HDFC Bank',      'Bank Accounts'),
  ('payment_mode', 'CARD',          'HDFC Bank',      'Bank Accounts'),
  ('payment_mode', 'UPI',           'HDFC Bank',      'Bank Accounts'),
  ('payment_mode', 'Bank Transfer', 'HDFC Bank',      'Bank Accounts'),
  ('payment_mode', 'NEFT',          'HDFC Bank',      'Bank Accounts'),
  ('payment_mode', 'RTGS',          'HDFC Bank',      'Bank Accounts'),
  ('payment_mode', 'ONLINE',        'HDFC Bank',      'Bank Accounts'),
  ('payment_mode', 'DD',            'HDFC Bank',      'Bank Accounts'),
  ('payment_mode', 'CHEQUE',        'HDFC Bank',      'Bank Accounts'),
  ('payment_mode', 'Insurance',     'Insurance Receivables', 'Sundry Debtors'),
  ('payment_mode', 'ESIC',          'ESIC Receivables',      'Sundry Debtors'),
  ('payment_mode', 'CGHS',          'CGHS Receivables',      'Sundry Debtors'),
  ('service_category', 'Hospital Income', 'Hospital Income', 'Direct Incomes'),
  ('pharmacy',         'Pharmacy Sales',  'Pharmacy Sales',  'Direct Incomes')
ON CONFLICT (adamrit_entity_type, adamrit_entity_name) DO NOTHING;
