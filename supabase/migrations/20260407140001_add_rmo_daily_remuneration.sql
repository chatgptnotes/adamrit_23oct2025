-- Add daily_remuneration and is_active columns to RMO master tables
ALTER TABLE hope_rmos ADD COLUMN IF NOT EXISTS daily_remuneration numeric DEFAULT 0;
ALTER TABLE hope_rmos ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE ayushman_rmos ADD COLUMN IF NOT EXISTS daily_remuneration numeric DEFAULT 0;
ALTER TABLE ayushman_rmos ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
