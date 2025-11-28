-- ============================================
-- Rename "Hope Hospital" to "hope" (lowercase)
-- ============================================
-- Problem: hospital_name has "Hope Hospital" but app expects "hope"
-- Solution: Update all Hope Hospital records to lowercase "hope"
-- Execute this in Supabase SQL Editor

-- ============================================
-- Step 1: Check current hospital names
-- ============================================
SELECT 'Before Update:' as status;
SELECT DISTINCT hospital_name, COUNT(*) as count
FROM room_management
GROUP BY hospital_name
ORDER BY hospital_name;

-- ============================================
-- Step 2: Update "Hope Hospital" to "hope"
-- ============================================

UPDATE room_management
SET hospital_name = 'hope'
WHERE hospital_name = 'Hope Hospital';

-- ============================================
-- Step 3: Verify the update
-- ============================================

SELECT 'After Update:' as status;
SELECT DISTINCT hospital_name, COUNT(*) as count
FROM room_management
GROUP BY hospital_name
ORDER BY hospital_name;

-- Expected Result:
-- ayushman | 4-5 (your Ayushman wards)
-- hope     | 10-15 (all Hope wards with lowercase 'hope')

-- ============================================
-- Step 4: View sample Hope records
-- ============================================

SELECT
  ward_id,
  ward_type,
  location,
  maximum_rooms,
  hospital_name
FROM room_management
WHERE hospital_name = 'hope'
ORDER BY ward_type
LIMIT 10;

-- ============================================
-- SUCCESS!
-- ============================================
-- Now Hope Hospital login will show all wards ✅
-- Refresh your Room Management page to see results
