-- ============================================================
-- Item 3: Add metadata JSONB column to tally_config for auto-sync schedule
-- ============================================================
-- Run this in Supabase SQL Editor

ALTER TABLE tally_config ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Example metadata structure for autoSync:
-- {
--   "autoSync": {
--     "enabled": true,
--     "intervalHours": 4,
--     "syncItems": ["ledgers", "groups", "stock", "vouchers"],
--     "lastSyncAt": "2026-03-01T14:00:00Z",
--     "nextSyncAt": "2026-03-01T18:00:00Z"
--   }
-- }
