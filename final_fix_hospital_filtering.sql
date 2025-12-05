-- ============================================
-- Final Fix: Hospital-Wise Ward Filtering
-- ============================================
-- Execute these commands IN ORDER in Supabase SQL Editor

-- ============================================
-- Step 1: Check Current Data
-- ============================================

-- See all current hospital names
SELECT DISTINCT hospital_name, COUNT(*) as count
FROM room_management
GROUP BY hospital_name;

-- ============================================
-- Step 2: Fix Hope Hospital Names
-- ============================================

-- Update all Hope Hospital records to lowercase 'hope'
UPDATE room_management
SET hospital_name = 'hope'
WHERE hospital_name = 'Hope Hospital'
   OR hospital_name ILIKE '%hope%'
   OR hospital_name IS NULL;

-- ============================================
-- Step 3: Add Ayushman Hospital Wards
-- ============================================

-- Insert Ayushman Hospital ward data
INSERT INTO room_management (ward_type, location, ward_id, maximum_rooms, hospital_name) VALUES
('General Ward - Ground Floor', 'Ayushman Bharat Complex', 'AYUGEN001', 20, 'ayushman'),
('ICU - First Floor', 'Ayushman Bharat Complex', 'AYUICU101', 10, 'ayushman'),
('Private Room - Second Floor', 'Ayushman Bharat Complex', 'AYUPRV201', 5, 'ayushman'),
('Semi-Private Room - Second Floor', 'Ayushman Bharat Complex', 'AYUSPR202', 10, 'ayushman'),
('Pediatric Ward - First Floor', 'Ayushman Bharat Complex', 'AYUPED102', 15, 'ayushman'),
('Maternity Ward - Third Floor', 'Ayushman Bharat Complex', 'AYUMAT301', 12, 'ayushman'),
('Emergency Ward - Ground Floor', 'Ayushman Bharat Complex', 'AYUEMR001', 8, 'ayushman'),
('Operation Theatre 1', 'Ayushman Bharat Complex', 'AYUOT1301', 1, 'ayushman'),
('Operation Theatre 2', 'Ayushman Bharat Complex', 'AYUOT2302', 1, 'ayushman'),
('Dialysis Unit - First Floor', 'Ayushman Bharat Complex', 'AYUDIA103', 20, 'ayushman'),
('Cardiac Care Unit', 'Ayushman Bharat Complex', 'AYUCCU201', 6, 'ayushman'),
('Post-Operative Ward', 'Ayushman Bharat Complex', 'AYUPOW202', 8, 'ayushman')
ON CONFLICT (ward_id) DO NOTHING;

-- ============================================
-- Step 4: Verification
-- ============================================

-- Count wards by hospital
SELECT
  hospital_name,
  COUNT(*) as ward_count
FROM room_management
GROUP BY hospital_name
ORDER BY hospital_name;

-- Expected Result:
-- ayushman | 12
-- hope     | 18-20

-- View Hope Hospital wards
SELECT ward_id, ward_type, location, maximum_rooms
FROM room_management
WHERE hospital_name = 'hope'
ORDER BY ward_type
LIMIT 10;

-- View Ayushman Hospital wards
SELECT ward_id, ward_type, location, maximum_rooms
FROM room_management
WHERE hospital_name = 'ayushman'
ORDER BY ward_type
LIMIT 10;

-- ============================================
-- SUCCESS! Now test in application:
-- ============================================
-- 1. Login with Hope Hospital → Should see ~20 Hope wards
-- 2. Logout → Login with Ayushman Hospital → Should see 12 Ayushman wards
-- 3. Each hospital sees ONLY their wards ✅
