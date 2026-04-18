-- Add is_active column to cghs_surgery table
ALTER TABLE cghs_surgery
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Index for faster filtering by is_active
CREATE INDEX IF NOT EXISTS idx_cghs_surgery_is_active
  ON cghs_surgery (is_active);
