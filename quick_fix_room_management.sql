-- ============================================
-- QUICK FIX for Room Management "No wards found"
-- ============================================
-- Execute these commands in Supabase SQL Editor IN ORDER

-- Step 1: Check if data exists
SELECT COUNT(*) as total_wards FROM room_management;
-- Expected: Should show number > 0

-- Step 2: Check hospital names
SELECT DISTINCT hospital_name, COUNT(*) as count
FROM room_management
GROUP BY hospital_name;
-- Problem if you see: "Hope Hospital" instead of "hope"

-- Step 3: Fix hospital names (if needed)
UPDATE room_management
SET hospital_name = 'hope'
WHERE hospital_name = 'Hope Hospital' OR hospital_name ILIKE '%hope%';

UPDATE room_management
SET hospital_name = 'ayushman'
WHERE hospital_name = 'Ayushman Hospital' OR hospital_name ILIKE '%ayushman%';

-- Step 4: Disable RLS temporarily for testing
ALTER TABLE room_management DISABLE ROW LEVEL SECURITY;

-- Step 5: Verify all wards are now visible
SELECT
  ward_id,
  ward_type,
  location,
  maximum_rooms,
  hospital_name
FROM room_management
ORDER BY ward_type
LIMIT 20;

-- ============================================
-- After wards are visible in the app:
-- ============================================

-- Re-enable RLS
-- ALTER TABLE room_management ENABLE ROW LEVEL SECURITY;
