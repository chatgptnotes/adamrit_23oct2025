-- ============================================
-- Debug Queries for Room Management Issue
-- ============================================
-- Execute these queries one by one in Supabase SQL Editor to debug

-- 1. Check if room_management table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'room_management'
);

-- 2. Count total records in room_management
SELECT COUNT(*) as total_records FROM room_management;

-- 3. Check distinct hospital_name values
SELECT DISTINCT hospital_name, COUNT(*) as count
FROM room_management
GROUP BY hospital_name;

-- 4. View all records
SELECT
  id,
  ward_type,
  location,
  ward_id,
  maximum_rooms,
  hospital_name,
  created_at
FROM room_management
ORDER BY created_at DESC
LIMIT 20;

-- 5. Check if any records match 'hope' (lowercase)
SELECT COUNT(*) as hope_count
FROM room_management
WHERE hospital_name = 'hope';

-- 6. Check if any records match 'Hope Hospital' (capitalized)
SELECT COUNT(*) as hope_hospital_count
FROM room_management
WHERE hospital_name = 'Hope Hospital';

-- 7. Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'room_management';

-- ============================================
-- FIXES BASED ON RESULTS:
-- ============================================

-- If hospital_name is still "Hope Hospital", run this:
-- UPDATE room_management SET hospital_name = 'hope' WHERE hospital_name = 'Hope Hospital';

-- If RLS is blocking access, temporarily disable it for testing:
-- ALTER TABLE room_management DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS after testing:
-- ALTER TABLE room_management ENABLE ROW LEVEL SECURITY;
