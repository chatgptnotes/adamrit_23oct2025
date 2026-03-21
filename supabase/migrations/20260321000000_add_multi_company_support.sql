-- ============================================================
-- Multi-Company Tally Support
-- Adds company_name column to all tally data tables,
-- backfills from active config, and updates unique constraints
-- ============================================================

-- ============================================================
-- Step 1: Add company_name column to all tally tables
-- ============================================================

ALTER TABLE tally_ledgers ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tally_vouchers ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tally_stock_items ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tally_groups ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tally_cost_centres ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tally_bank_statements ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tally_gst_data ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tally_reports ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tally_sync_log ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE tally_push_queue ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tally_ledger_mapping ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';

-- ============================================================
-- Step 2: Backfill existing data with company name from active config
-- ============================================================

DO $$
DECLARE
  v_company TEXT;
BEGIN
  SELECT company_name INTO v_company FROM tally_config WHERE is_active = true LIMIT 1;
  IF v_company IS NOT NULL AND v_company != '' THEN
    UPDATE tally_ledgers SET company_name = v_company WHERE company_name = '';
    UPDATE tally_vouchers SET company_name = v_company WHERE company_name = '';
    UPDATE tally_stock_items SET company_name = v_company WHERE company_name = '';
    UPDATE tally_groups SET company_name = v_company WHERE company_name = '';
    UPDATE tally_cost_centres SET company_name = v_company WHERE company_name = '';
    UPDATE tally_bank_statements SET company_name = v_company WHERE company_name = '';
    UPDATE tally_gst_data SET company_name = v_company WHERE company_name = '';
    UPDATE tally_reports SET company_name = v_company WHERE company_name = '';
    UPDATE tally_sync_log SET company_name = v_company WHERE company_name IS NULL;
    UPDATE tally_push_queue SET company_name = v_company WHERE company_name = '';
    UPDATE tally_ledger_mapping SET company_name = v_company WHERE company_name = '';
  END IF;
END $$;

-- ============================================================
-- Step 3: Drop old unique constraints and create new composite ones
-- ============================================================

-- tally_ledgers: old UNIQUE(tally_guid) → new UNIQUE(company_name, name)
ALTER TABLE tally_ledgers DROP CONSTRAINT IF EXISTS tally_ledgers_tally_guid_key;
DROP INDEX IF EXISTS tally_ledgers_tally_guid_key;
ALTER TABLE tally_ledgers ADD CONSTRAINT tally_ledgers_company_name_key UNIQUE (company_name, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tally_ledgers_guid_notnull ON tally_ledgers(tally_guid) WHERE tally_guid IS NOT NULL AND tally_guid != '';

-- tally_vouchers: old UNIQUE(tally_guid) → new UNIQUE(company_name, tally_guid)
ALTER TABLE tally_vouchers DROP CONSTRAINT IF EXISTS tally_vouchers_tally_guid_key;
DROP INDEX IF EXISTS tally_vouchers_tally_guid_key;
ALTER TABLE tally_vouchers ADD CONSTRAINT tally_vouchers_company_guid_key UNIQUE (company_name, tally_guid);

-- tally_stock_items: old UNIQUE(tally_guid) → new UNIQUE(company_name, name)
ALTER TABLE tally_stock_items DROP CONSTRAINT IF EXISTS tally_stock_items_tally_guid_key;
DROP INDEX IF EXISTS tally_stock_items_tally_guid_key;
ALTER TABLE tally_stock_items ADD CONSTRAINT tally_stock_items_company_name_key UNIQUE (company_name, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tally_stock_items_guid_notnull ON tally_stock_items(tally_guid) WHERE tally_guid IS NOT NULL AND tally_guid != '';

-- tally_groups: old UNIQUE(name) → new UNIQUE(company_name, name)
ALTER TABLE tally_groups DROP CONSTRAINT IF EXISTS tally_groups_name_key;
DROP INDEX IF EXISTS tally_groups_name_key;
ALTER TABLE tally_groups ADD CONSTRAINT tally_groups_company_name_key UNIQUE (company_name, name);

-- tally_cost_centres: old UNIQUE(name) → new UNIQUE(company_name, name)
ALTER TABLE tally_cost_centres DROP CONSTRAINT IF EXISTS tally_cost_centres_name_key;
DROP INDEX IF EXISTS tally_cost_centres_name_key;
ALTER TABLE tally_cost_centres ADD CONSTRAINT tally_cost_centres_company_name_key UNIQUE (company_name, name);

-- tally_ledger_mapping: old UNIQUE(adamrit_entity_type, adamrit_entity_name) → new with company_name
ALTER TABLE tally_ledger_mapping DROP CONSTRAINT IF EXISTS tally_ledger_mapping_unique;
ALTER TABLE tally_ledger_mapping DROP CONSTRAINT IF EXISTS tally_ledger_mapping_adamrit_entity_type_adamrit_entity_na_key;
ALTER TABLE tally_ledger_mapping ADD CONSTRAINT tally_ledger_mapping_company_unique UNIQUE (company_name, adamrit_entity_type, adamrit_entity_name);

-- ============================================================
-- Step 4: Add indexes on company_name
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tally_ledgers_company ON tally_ledgers(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_vouchers_company ON tally_vouchers(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_stock_items_company ON tally_stock_items(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_groups_company ON tally_groups(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_cost_centres_company ON tally_cost_centres(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_bank_statements_company ON tally_bank_statements(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_gst_data_company ON tally_gst_data(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_reports_company ON tally_reports(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_sync_log_company ON tally_sync_log(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_push_queue_company ON tally_push_queue(company_name);
CREATE INDEX IF NOT EXISTS idx_tally_ledger_mapping_company ON tally_ledger_mapping(company_name);
