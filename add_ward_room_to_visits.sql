-- ============================================
-- Add Ward and Room Fields to Visits Table
-- ============================================
-- This migration adds ward_allotted and room_allotted columns to the visits table
-- Execute this in Supabase SQL Editor

-- ============================================
-- Step 1: Add new columns to visits table
-- ============================================

ALTER TABLE visits
ADD COLUMN IF NOT EXISTS ward_allotted TEXT,
ADD COLUMN IF NOT EXISTS room_allotted TEXT;

-- ============================================
-- Step 2: Add comments for documentation
-- ============================================

COMMENT ON COLUMN visits.ward_allotted IS 'Ward ID from room_management table';
COMMENT ON COLUMN visits.room_allotted IS 'Room number allotted to patient';

-- ============================================
-- Step 3: Create index for faster queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_visits_ward_allotted ON visits(ward_allotted);
CREATE INDEX IF NOT EXISTS idx_visits_room_allotted ON visits(room_allotted);

-- ============================================
-- Step 4: Verification
-- ============================================

-- Check if columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'visits'
  AND column_name IN ('ward_allotted', 'room_allotted');

-- Expected Result:
-- ward_allotted  | text | YES
-- room_allotted  | text | YES

-- ============================================
-- SUCCESS!
-- ============================================
-- Columns added successfully to visits table
-- Now you can store ward and room allocation data with each visit
