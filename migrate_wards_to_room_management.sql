-- ============================================
-- Migrate Data from 'wards' to 'room_management'
-- ============================================
-- This script creates room_management table and copies all data from wards table
-- Execute this in Supabase SQL Editor
-- IMPORTANT: This will also update hospital_name to match application config
-- ("Hope Hospital" → "hope", "Ayushman Hospital" → "ayushman")

-- ============================================
-- Step 1: Create room_management table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS room_management (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ward_type TEXT NOT NULL,
  location TEXT NOT NULL,
  ward_id TEXT NOT NULL UNIQUE,
  maximum_rooms INTEGER NOT NULL,
  hospital_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Step 2: Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_room_management_ward_id ON room_management(ward_id);
CREATE INDEX IF NOT EXISTS idx_room_management_hospital_name ON room_management(hospital_name);
CREATE INDEX IF NOT EXISTS idx_room_management_created_at ON room_management(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_management_ward_type ON room_management(ward_type);

-- ============================================
-- Step 3: Enable Row Level Security
-- ============================================
ALTER TABLE room_management ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'room_management'
    AND policyname = 'Allow authenticated users to read room_management'
  ) THEN
    CREATE POLICY "Allow authenticated users to read room_management"
      ON room_management FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'room_management'
    AND policyname = 'Allow authenticated users to insert room_management'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert room_management"
      ON room_management FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'room_management'
    AND policyname = 'Allow authenticated users to update room_management'
  ) THEN
    CREATE POLICY "Allow authenticated users to update room_management"
      ON room_management FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'room_management'
    AND policyname = 'Allow authenticated users to delete room_management'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete room_management"
      ON room_management FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- ============================================
-- Step 4: Copy ALL data from wards to room_management
-- ============================================

-- Insert all records from wards table into room_management
-- ON CONFLICT ensures we don't create duplicates
-- IMPORTANT: Convert hospital_name to lowercase matching application config
INSERT INTO room_management (id, ward_type, location, ward_id, maximum_rooms, hospital_name, created_at, updated_at)
SELECT
  id,
  ward_type,
  location,
  ward_id,
  maximum_rooms,
  CASE
    WHEN hospital_name ILIKE '%hope%' THEN 'hope'
    WHEN hospital_name ILIKE '%ayushman%' THEN 'ayushman'
    ELSE LOWER(hospital_name)
  END as hospital_name,
  created_at,
  updated_at
FROM wards
ON CONFLICT (ward_id) DO UPDATE SET
  ward_type = EXCLUDED.ward_type,
  location = EXCLUDED.location,
  maximum_rooms = EXCLUDED.maximum_rooms,
  hospital_name = EXCLUDED.hospital_name,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- Step 5: Verification
-- ============================================

-- Count records in both tables
SELECT
  'wards' as table_name,
  COUNT(*) as record_count
FROM wards
UNION ALL
SELECT
  'room_management' as table_name,
  COUNT(*) as record_count
FROM room_management;

-- Show all migrated records
SELECT
  ward_id,
  ward_type,
  location,
  maximum_rooms,
  hospital_name
FROM room_management
ORDER BY ward_type;

-- ============================================
-- Optional: Drop wards table after verification
-- ============================================
-- IMPORTANT: Only run this AFTER verifying data is correctly migrated
-- Uncomment the line below to drop the old wards table:
-- DROP TABLE wards;
