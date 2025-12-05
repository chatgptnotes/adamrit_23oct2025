-- ============================================
-- Update Hospital Names to Match Application Config
-- ============================================
-- This script updates existing hospital_name values to match the lowercase
-- hospital identifiers used in the application (hospital.ts config)
-- Execute this in Supabase SQL Editor

-- ============================================
-- Update existing records
-- ============================================

-- Change "Hope Hospital" to "hope"
UPDATE room_management
SET hospital_name = 'hope'
WHERE hospital_name = 'Hope Hospital';

-- Change "Ayushman Hospital" to "ayushman" (if exists)
UPDATE room_management
SET hospital_name = 'ayushman'
WHERE hospital_name = 'Ayushman Hospital';

-- Update any other variations to standardized names
UPDATE room_management
SET hospital_name = 'hope'
WHERE hospital_name ILIKE '%hope%' AND hospital_name != 'hope';

UPDATE room_management
SET hospital_name = 'ayushman'
WHERE hospital_name ILIKE '%ayushman%' AND hospital_name != 'ayushman';

-- ============================================
-- Verification
-- ============================================

-- Check updated hospital names
SELECT
  hospital_name,
  COUNT(*) as ward_count
FROM room_management
GROUP BY hospital_name
ORDER BY hospital_name;

-- View all records
SELECT
  ward_id,
  ward_type,
  location,
  hospital_name
FROM room_management
ORDER BY hospital_name, ward_type;
