-- ============================================================
-- Refactor: company_name → company_id (FK) in all Tally tables
-- Replaces TEXT-based company_name with UUID FK to tally_config.id
-- ============================================================

-- ============================================================
-- Step 1: Add company_id column to all tally tables
-- ============================================================

ALTER TABLE tally_ledgers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_vouchers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_stock_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_groups ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_cost_centres ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_bank_statements ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_gst_data ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_reports ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_sync_log ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_push_queue ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);
ALTER TABLE tally_ledger_mapping ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES tally_config(id);

-- ============================================================
-- Step 2: Backfill company_id from company_name → tally_config.id
-- ============================================================

UPDATE tally_ledgers SET company_id = tc.id FROM tally_config tc WHERE tally_ledgers.company_name = tc.company_name AND tally_ledgers.company_id IS NULL;
UPDATE tally_vouchers SET company_id = tc.id FROM tally_config tc WHERE tally_vouchers.company_name = tc.company_name AND tally_vouchers.company_id IS NULL;
UPDATE tally_stock_items SET company_id = tc.id FROM tally_config tc WHERE tally_stock_items.company_name = tc.company_name AND tally_stock_items.company_id IS NULL;
UPDATE tally_groups SET company_id = tc.id FROM tally_config tc WHERE tally_groups.company_name = tc.company_name AND tally_groups.company_id IS NULL;
UPDATE tally_cost_centres SET company_id = tc.id FROM tally_config tc WHERE tally_cost_centres.company_name = tc.company_name AND tally_cost_centres.company_id IS NULL;
UPDATE tally_bank_statements SET company_id = tc.id FROM tally_config tc WHERE tally_bank_statements.company_name = tc.company_name AND tally_bank_statements.company_id IS NULL;
UPDATE tally_gst_data SET company_id = tc.id FROM tally_config tc WHERE tally_gst_data.company_name = tc.company_name AND tally_gst_data.company_id IS NULL;
UPDATE tally_reports SET company_id = tc.id FROM tally_config tc WHERE tally_reports.company_name = tc.company_name AND tally_reports.company_id IS NULL;
UPDATE tally_sync_log SET company_id = tc.id FROM tally_config tc WHERE tally_sync_log.company_name = tc.company_name AND tally_sync_log.company_id IS NULL;
UPDATE tally_push_queue SET company_id = tc.id FROM tally_config tc WHERE tally_push_queue.company_name = tc.company_name AND tally_push_queue.company_id IS NULL;
UPDATE tally_ledger_mapping SET company_id = tc.id FROM tally_config tc WHERE tally_ledger_mapping.company_name = tc.company_name AND tally_ledger_mapping.company_id IS NULL;

-- ============================================================
-- Step 3: Drop old company_name-based unique constraints
-- ============================================================

ALTER TABLE tally_ledgers DROP CONSTRAINT IF EXISTS tally_ledgers_company_name_key;
ALTER TABLE tally_vouchers DROP CONSTRAINT IF EXISTS tally_vouchers_company_guid_key;
ALTER TABLE tally_stock_items DROP CONSTRAINT IF EXISTS tally_stock_items_company_name_key;
ALTER TABLE tally_groups DROP CONSTRAINT IF EXISTS tally_groups_company_name_key;
ALTER TABLE tally_cost_centres DROP CONSTRAINT IF EXISTS tally_cost_centres_company_name_key;
ALTER TABLE tally_ledger_mapping DROP CONSTRAINT IF EXISTS tally_ledger_mapping_company_unique;

-- ============================================================
-- Step 4: Create new unique constraints using company_id
-- ============================================================

ALTER TABLE tally_ledgers ADD CONSTRAINT tally_ledgers_company_id_name_key UNIQUE (company_id, name);
ALTER TABLE tally_vouchers ADD CONSTRAINT tally_vouchers_company_id_guid_key UNIQUE (company_id, tally_guid);
ALTER TABLE tally_stock_items ADD CONSTRAINT tally_stock_items_company_id_name_key UNIQUE (company_id, name);
ALTER TABLE tally_groups ADD CONSTRAINT tally_groups_company_id_name_key UNIQUE (company_id, name);
ALTER TABLE tally_cost_centres ADD CONSTRAINT tally_cost_centres_company_id_name_key UNIQUE (company_id, name);
ALTER TABLE tally_ledger_mapping ADD CONSTRAINT tally_ledger_mapping_company_id_unique UNIQUE (company_id, adamrit_entity_type, adamrit_entity_name);

-- ============================================================
-- Step 5: Drop old company_name columns from data tables
-- ============================================================

ALTER TABLE tally_ledgers DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_vouchers DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_stock_items DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_groups DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_cost_centres DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_bank_statements DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_gst_data DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_reports DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_sync_log DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_push_queue DROP COLUMN IF EXISTS company_name;
ALTER TABLE tally_ledger_mapping DROP COLUMN IF EXISTS company_name;

-- Drop old company_name indexes
DROP INDEX IF EXISTS idx_tally_ledgers_company;
DROP INDEX IF EXISTS idx_tally_vouchers_company;
DROP INDEX IF EXISTS idx_tally_stock_items_company;
DROP INDEX IF EXISTS idx_tally_groups_company;
DROP INDEX IF EXISTS idx_tally_cost_centres_company;
DROP INDEX IF EXISTS idx_tally_bank_statements_company;
DROP INDEX IF EXISTS idx_tally_gst_data_company;
DROP INDEX IF EXISTS idx_tally_reports_company;
DROP INDEX IF EXISTS idx_tally_sync_log_company;
DROP INDEX IF EXISTS idx_tally_push_queue_company;
DROP INDEX IF EXISTS idx_tally_ledger_mapping_company;

-- ============================================================
-- Step 6: Add indexes on company_id
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tally_ledgers_company_id ON tally_ledgers(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_vouchers_company_id ON tally_vouchers(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_stock_items_company_id ON tally_stock_items(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_groups_company_id ON tally_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_cost_centres_company_id ON tally_cost_centres(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_bank_statements_company_id ON tally_bank_statements(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_gst_data_company_id ON tally_gst_data(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_reports_company_id ON tally_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_sync_log_company_id ON tally_sync_log(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_push_queue_company_id ON tally_push_queue(company_id);
CREATE INDEX IF NOT EXISTS idx_tally_ledger_mapping_company_id ON tally_ledger_mapping(company_id);
