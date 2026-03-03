-- ============================================================
-- Tally Prime Sync Tables
-- Created to support the tally-proxy API and file-export sync
-- ============================================================

-- 1. tally_sync_log: tracks every sync run (file export or HTTP)
CREATE TABLE IF NOT EXISTS tally_sync_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type       TEXT NOT NULL,
  direction       TEXT NOT NULL DEFAULT 'inward',  -- 'inward' = Tally→Adamrit, 'outward' = Adamrit→Tally
  status          TEXT NOT NULL DEFAULT 'started', -- started | completed | partial | failed
  records_synced  INTEGER DEFAULT 0,
  records_failed  INTEGER DEFAULT 0,
  error_details   JSONB,
  started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at    TIMESTAMP WITH TIME ZONE,
  duration_ms     INTEGER,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. tally_ledgers: master list of ledgers pulled from Tally
CREATE TABLE IF NOT EXISTS tally_ledgers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  tally_guid      TEXT UNIQUE,
  parent_group    TEXT,
  opening_balance NUMERIC(15,2) DEFAULT 0,
  closing_balance NUMERIC(15,2) DEFAULT 0,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  gst_number      TEXT,
  pan_number      TEXT,
  last_synced_at  TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT tally_ledgers_name_unique UNIQUE (name)
);

-- 3. tally_groups: account groups from Tally (Capital, Revenue, etc.)
CREATE TABLE IF NOT EXISTS tally_groups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  parent_group        TEXT,
  nature_of_group     TEXT,
  is_revenue          BOOLEAN DEFAULT false,
  is_deemed_positive  BOOLEAN DEFAULT false,
  last_synced_at      TIMESTAMP WITH TIME ZONE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. tally_stock_items: inventory items from Tally
CREATE TABLE IF NOT EXISTS tally_stock_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  tally_guid      TEXT UNIQUE,
  stock_group     TEXT,
  unit            TEXT,
  opening_balance NUMERIC(15,4) DEFAULT 0,
  closing_balance NUMERIC(15,4) DEFAULT 0,
  opening_value   NUMERIC(15,2) DEFAULT 0,
  closing_value   NUMERIC(15,2) DEFAULT 0,
  rate            NUMERIC(15,4) DEFAULT 0,
  gst_rate        NUMERIC(6,2) DEFAULT 0,
  hsn_code        TEXT,
  last_synced_at  TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT tally_stock_items_name_unique UNIQUE (name)
);

-- 5. tally_vouchers: all transactions pulled from Tally Day Book
CREATE TABLE IF NOT EXISTS tally_vouchers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tally_guid      TEXT UNIQUE,
  voucher_number  TEXT,
  voucher_type    TEXT,                -- Payment, Receipt, Journal, Sales, Purchase, etc.
  date            DATE,
  party_ledger    TEXT,
  amount          NUMERIC(15,2) DEFAULT 0,
  narration       TEXT,
  is_cancelled    BOOLEAN DEFAULT false,
  sync_direction  TEXT DEFAULT 'from_tally',
  sync_status     TEXT DEFAULT 'synced',
  ledger_entries  JSONB,               -- array of {ledger, amount, is_debit}
  synced_at       TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. tally_reports: snapshots of financial reports (Trial Balance, P&L, BS)
CREATE TABLE IF NOT EXISTS tally_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type  TEXT NOT NULL,         -- trial_balance | balance_sheet | pnl | outstanding_receivables | outstanding_payables
  report_date  DATE,
  period_from  DATE,
  period_to    DATE,
  data         JSONB,                 -- { raw: '<XML...>', source: 'file_export'|'http' }
  fetched_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. tally_gst_data: GST return data (GSTR-1, GSTR-3B)
CREATE TABLE IF NOT EXISTS tally_gst_data (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type  TEXT NOT NULL,         -- gstr1 | gstr3b | gst_ledger
  period_from  DATE,
  period_to    DATE,
  data         JSONB,
  fetched_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Fix tally_config column names ───────────────────────────────────────────
-- The proxy uses is_active and last_sync_at. Add them if they don't exist yet.

ALTER TABLE tally_config
  ADD COLUMN IF NOT EXISTS is_active     BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_sync_at  TIMESTAMP WITH TIME ZONE;

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tally_sync_log_type       ON tally_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_tally_sync_log_status     ON tally_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_tally_sync_log_started    ON tally_sync_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tally_ledgers_guid        ON tally_ledgers(tally_guid);
CREATE INDEX IF NOT EXISTS idx_tally_ledgers_name        ON tally_ledgers(name);
CREATE INDEX IF NOT EXISTS idx_tally_stock_guid          ON tally_stock_items(tally_guid);
CREATE INDEX IF NOT EXISTS idx_tally_vouchers_guid       ON tally_vouchers(tally_guid);
CREATE INDEX IF NOT EXISTS idx_tally_vouchers_date       ON tally_vouchers(date DESC);
CREATE INDEX IF NOT EXISTS idx_tally_vouchers_type       ON tally_vouchers(voucher_type);
CREATE INDEX IF NOT EXISTS idx_tally_reports_type        ON tally_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_tally_reports_date        ON tally_reports(report_date DESC);

-- ─── Row-Level Security ───────────────────────────────────────────────────────

ALTER TABLE tally_sync_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tally_ledgers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tally_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tally_stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tally_vouchers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tally_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tally_gst_data    ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access to all tally sync tables
CREATE POLICY "authenticated_all_tally_sync_log"    ON tally_sync_log    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all_tally_ledgers"     ON tally_ledgers     FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all_tally_groups"      ON tally_groups      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all_tally_stock_items" ON tally_stock_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all_tally_vouchers"    ON tally_vouchers    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all_tally_reports"     ON tally_reports     FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all_tally_gst_data"    ON tally_gst_data    FOR ALL USING (auth.role() = 'authenticated');

-- The sync script runs with service_role key (bypasses RLS), so these policies
-- are for Adam Rith's frontend users to READ the synced data.

-- ─── updated_at trigger for tables that have it ───────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tally_ledgers_updated_at
  BEFORE UPDATE ON tally_ledgers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tally_stock_items_updated_at
  BEFORE UPDATE ON tally_stock_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
