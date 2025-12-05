-- ============================================
-- AYUSHMAN HOSPITAL - QUICK FIX
-- ============================================
-- Problem: No wards found for Ayushman Hospital
-- Solution: Insert Ayushman ward data
-- Execute this ENTIRE file in Supabase SQL Editor

-- ============================================
-- Step 1: Check current data
-- ============================================
SELECT 'Current hospital data:' as info;
SELECT DISTINCT hospital_name, COUNT(*) as count
FROM room_management
GROUP BY hospital_name;

-- ============================================
-- Step 2: Insert Ayushman Hospital Wards (from screenshot)
-- ============================================

INSERT INTO room_management (ward_type, location, ward_id, maximum_rooms, hospital_name) VALUES
('General Ward', 'Ayushman Bharat Complex', 'GENAYU261', 1, 'ayushman'),
('Private - Single occupancy, Attached toilet - 1st Floor', 'Ayushman Bharat Complex', 'PRIAYU092', 1, 'ayushman'),
('Twin-Sharing, double occupancy, attached toilet - 3rd floor', 'Ayushman Bharat Complex', 'TWIAYU802', 7, 'ayushman'),
('Private - Single occupancy, without attached toilet - 3rd floor', 'Ayushman Bharat Complex', 'PRIAYU566', 5, 'ayushman'),
('Private - Single occupancy, without attached toilet - First floor', 'Ayushman Bharat Complex', 'PRIAYU409', 10, 'ayushman'),
('CICU -Third floor', 'Ayushman Bharat Complex', 'CICAYU269', 1, 'ayushman'),
('General Ward Third Floor', 'Ayushman Bharat Complex', 'GENAYU807', 1, 'ayushman'),
('Twin-Sharing, double occupancy, attached toilet -first floor', 'Ayushman Bharat Complex', 'TWIAYU399', 1, 'ayushman'),
('Private - Single occupancy, Attached toilet - first floor, SPL Ward', 'Ayushman Bharat Complex', 'SPEAYU589', 1, 'ayushman'),
('ICU Third Floor', 'Ayushman Bharat Complex', 'ICUAYU094', 1, 'ayushman')
ON CONFLICT (ward_id) DO NOTHING;

-- ============================================
-- Step 3: Verify Ayushman data inserted
-- ============================================

SELECT 'Ayushman wards count:' as info;
SELECT COUNT(*) as ayushman_ward_count
FROM room_management
WHERE hospital_name = 'ayushman';

-- Should show: 10

-- ============================================
-- Step 4: View all Ayushman wards
-- ============================================

SELECT 'All Ayushman wards:' as info;
SELECT
  ward_id,
  ward_type,
  location,
  maximum_rooms,
  hospital_name
FROM room_management
WHERE hospital_name = 'ayushman'
ORDER BY ward_type;

-- ============================================
-- SUCCESS!
-- ============================================
-- Now refresh your Room Management page in browser
-- Ayushman login will show 10 wards! ✅
