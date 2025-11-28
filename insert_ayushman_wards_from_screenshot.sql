-- ============================================
-- Insert Ayushman Hospital Ward Data from Screenshot
-- ============================================
-- This script inserts ward data shown in the screenshot for Ayushman Hospital
-- Execute this in Supabase SQL Editor

-- Note: Ward IDs have been modified to be Ayushman-specific (AYU prefix instead of HOP/GLO)
-- hospital_name = 'ayushman' for proper filtering
-- Location changed to 'Ayushman Bharat Complex'

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
-- Alternative: If you want to keep original ward IDs
-- ============================================
-- Uncomment below if you want to use original Hope ward IDs for Ayushman
-- This allows same ward structure for both hospitals

/*
INSERT INTO room_management (ward_type, location, ward_id, maximum_rooms, hospital_name) VALUES
('General Ward', 'Ayushman Bharat Complex', 'GENHOP261', 1, 'ayushman'),
('Private - Single occupancy, Attached toilet - 1st Floor', 'Ayushman Bharat Complex', 'PRIHOP092', 1, 'ayushman'),
('Twin-Sharing, double occupancy, attached toilet - 3rd floor', 'Ayushman Bharat Complex', 'TWIHOP802', 7, 'ayushman'),
('Private - Single occupancy, without attached toilet - 3rd floor', 'Ayushman Bharat Complex', 'PRIHOP566', 5, 'ayushman'),
('Private - Single occupancy, without attached toilet - First floor', 'Ayushman Bharat Complex', 'PRIHOP409', 10, 'ayushman'),
('CICU -Third floor', 'Ayushman Bharat Complex', 'CICHOP269', 1, 'ayushman'),
('General Ward Third Floor', 'Ayushman Bharat Complex', 'GENHOP807', 1, 'ayushman'),
('Twin-Sharing, double occupancy, attached toilet -first floor', 'Ayushman Bharat Complex', 'TWIGLO399', 1, 'ayushman'),
('Private - Single occupancy, Attached toilet - first floor, SPL Ward', 'Ayushman Bharat Complex', 'SPEGLO589', 1, 'ayushman'),
('ICU Third Floor', 'Ayushman Bharat Complex', 'ICUGLO094', 1, 'ayushman')
ON CONFLICT (ward_id) DO UPDATE SET
  hospital_name = EXCLUDED.hospital_name,
  location = EXCLUDED.location,
  ward_type = EXCLUDED.ward_type,
  maximum_rooms = EXCLUDED.maximum_rooms;
*/

-- ============================================
-- Verification
-- ============================================

-- Count Ayushman wards
SELECT COUNT(*) as ayushman_ward_count
FROM room_management
WHERE hospital_name = 'ayushman';

-- View all Ayushman wards
SELECT
  ward_id,
  ward_type,
  location,
  maximum_rooms,
  hospital_name
FROM room_management
WHERE hospital_name = 'ayushman'
ORDER BY ward_type;

-- Summary by hospital
SELECT
  hospital_name,
  COUNT(*) as total_wards
FROM room_management
GROUP BY hospital_name
ORDER BY hospital_name;
