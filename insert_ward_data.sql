-- ============================================
-- Insert Ward Data into room_management Table
-- ============================================
-- This script inserts all ward data from the Ward Management screenshot
-- Execute this in Supabase SQL Editor
-- Note: ON CONFLICT clause ensures no duplicates are created
-- IMPORTANT: hospital_name uses lowercase values matching hospital.ts config ('hope', 'ayushman')

-- Insert all ward data for Hope Hospital
INSERT INTO room_management (ward_type, location, ward_id, maximum_rooms, hospital_name) VALUES
('Delux Room - FIRST FLOOR', 'Hope Group', 'VIPHOP980', 4, 'hope'),
('ICU Third Floor', 'Hope Group', 'ICUHOP210', 0, 'hope'),
('Semi Private Room', 'Hope Group', 'TWIHOP602', 8, 'hope'),
('Dialysis Unit', 'Hope Group', 'DIAHOP267', 50, 'hope'),
('FEMALE WARD', 'Hope Group', 'FEMHOP815', 10, 'hope'),
('ICU Charges', 'Hope Group', 'ICUHOP107', 10, 'hope'),
('Minor OT, Third floor, OT3, 3030-3031', 'Hope Group', 'MINHOP873', 1, 'hope'),
('Cardiac OT, Third floor, OT2, 3021-3029', 'Hope Group', 'CARHOP206', 1, 'hope'),
('Ortho OT, Third floor, OT1, 3012-3020', 'Hope Group', 'ORTHOP090', 1, 'hope'),
('Private - Single occupancy, Attached toilet - second floor', 'Hope Group', 'PRIHOP092', 1, 'hope'),
('Twin-Sharing, double occupancy, attached toilet - second floor 201-210 , 2001-2017', 'Hope Group', 'TWIHOP802', 7, 'hope'),
('Private - Single occupancy, without attached toilet - Secondfloor SP1', 'Hope Group', 'PRIHOP566', 5, 'hope'),
('ICU TRAUMA, 1-3 , LEFT OF CORRIDOR, Burns 2022-2024, second floor', 'Hope Group', 'GENHOP625', 1, 'hope'),
('Private - Single occupancy, without attached toilet - First floor', 'Hope Group', 'PRIHOP409', 10, 'hope'),
('CICU -Third floor', 'Hope Group', 'CICHOP269', 1, 'hope'),
('General Ward (M) second floor', 'Hope Group', 'GENHOP807', 1, 'hope'),
('General Ward (F) second floor', 'Hope Group', 'GENHOP954', 2, 'hope'),
('Twin-Sharing, double occupancy, attached toilet -first floor', 'Hope Group', 'TWIGLO399', 1, 'hope'),
('Private - Single occupancy, Attached toilet - first floor, SP1, Ward -1st Floor +kumar sideroom', 'Hope Group', 'SPEGLO689', 1, 'hope'),
('ICU First floor 1020-1029', 'Hope Group', 'ICUGLO094', 10, 'hope')
ON CONFLICT (ward_id) DO NOTHING;

-- Verify the data was inserted
SELECT COUNT(*) as total_wards FROM room_management;

-- View all inserted wards
SELECT ward_id, ward_type, location, maximum_rooms
FROM room_management
ORDER BY ward_type;
