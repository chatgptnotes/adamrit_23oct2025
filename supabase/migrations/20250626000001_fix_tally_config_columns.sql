-- ============================================================
-- Fix tally_config table columns
-- The code uses different column names than the original migration.
-- This adds the missing columns so the Dashboard save/load works.
-- ============================================================

ALTER TABLE tally_config
  ADD COLUMN IF NOT EXISTS server_url              TEXT,
  ADD COLUMN IF NOT EXISTS auto_sync_enabled       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_interval_minutes   INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS metadata                JSONB;

-- Copy any data from old column names to new ones (safe - IF NOT EXISTS above)
UPDATE tally_config
SET server_url = tally_server_url
WHERE server_url IS NULL AND tally_server_url IS NOT NULL;
