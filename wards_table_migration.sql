-- ============================================
-- Ward Management Table Migration
-- ============================================
-- This script creates the room_management table for the Room Management Dashboard
-- Execute this in Supabase SQL Editor

-- Create the room_management table
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

-- Add comments to table and columns for documentation
COMMENT ON TABLE room_management IS 'Stores hospital ward/room information for Room Management Dashboard';
COMMENT ON COLUMN room_management.id IS 'Unique identifier for the ward';
COMMENT ON COLUMN room_management.ward_type IS 'Type of ward (e.g., Delux Room - FIRST FLOOR, ICU Third Floor)';
COMMENT ON COLUMN room_management.location IS 'Location or hospital group (e.g., Hope Group)';
COMMENT ON COLUMN room_management.ward_id IS 'Unique ward identifier (e.g., VIPHOP980)';
COMMENT ON COLUMN room_management.maximum_rooms IS 'Maximum number of rooms/beds in the ward';
COMMENT ON COLUMN room_management.hospital_name IS 'Associated hospital name for multi-hospital systems';
COMMENT ON COLUMN room_management.created_at IS 'Timestamp when the ward was created';
COMMENT ON COLUMN room_management.updated_at IS 'Timestamp when the ward was last updated';

-- ============================================
-- Create Indexes for Performance
-- ============================================

-- Index on ward_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_room_management_ward_id ON room_management(ward_id);

-- Index on hospital_name for filtering by hospital
CREATE INDEX IF NOT EXISTS idx_room_management_hospital_name ON room_management(hospital_name);

-- Index on created_at for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_room_management_created_at ON room_management(created_at DESC);

-- Index on ward_type for searching
CREATE INDEX IF NOT EXISTS idx_room_management_ward_type ON room_management(ward_type);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable Row Level Security
ALTER TABLE room_management ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read wards
CREATE POLICY "Allow authenticated users to read room_management"
  ON room_management
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert wards
CREATE POLICY "Allow authenticated users to insert room_management"
  ON room_management
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update wards
CREATE POLICY "Allow authenticated users to update room_management"
  ON room_management
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete wards
CREATE POLICY "Allow authenticated users to delete room_management"
  ON room_management
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- Sample Data (Optional - Comment out if not needed)
-- ============================================
-- IMPORTANT: hospital_name uses lowercase values matching hospital.ts config ('hope', 'ayushman')

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
('Twin-Sharing, double occupancy, attached toilet -first floor', 'Hope Group', 'TWIGLO399', 1, 'hope')
ON CONFLICT (ward_id) DO NOTHING;

-- ============================================
-- Verification Queries
-- ============================================

-- Count total wards
-- SELECT COUNT(*) as total_wards FROM room_management;

-- View all wards
-- SELECT * FROM room_management ORDER BY created_at DESC;

-- View wards by hospital
-- SELECT * FROM room_management WHERE hospital_name = 'Hope Hospital';
