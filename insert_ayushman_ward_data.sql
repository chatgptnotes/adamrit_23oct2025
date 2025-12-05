-- ============================================
-- Insert Ayushman Hospital Ward Data
-- ============================================
-- This script inserts sample ward data for Ayushman Hospital
-- Execute this in Supabase SQL Editor after setting up room_management table
-- Note: ON CONFLICT clause ensures no duplicates are created

-- Insert all ward data for Ayushman Hospital
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
-- Verification
-- ============================================

-- Count wards by hospital
SELECT
  hospital_name,
  COUNT(*) as ward_count
FROM room_management
GROUP BY hospital_name
ORDER BY hospital_name;

-- View Ayushman Hospital wards
SELECT
  ward_id,
  ward_type,
  location,
  maximum_rooms,
  hospital_name
FROM room_management
WHERE hospital_name = 'ayushman'
ORDER BY ward_type;
