-- ============================================
-- Rename 'wards' table to 'room_management'
-- ============================================
-- This script renames the existing wards table to room_management
-- Execute this in Supabase SQL Editor

-- Rename the table
ALTER TABLE wards RENAME TO room_management;

-- The following will be automatically updated:
-- - All indexes (idx_wards_* will remain but point to room_management)
-- - All constraints (including PRIMARY KEY and UNIQUE constraints)
-- - All RLS policies

-- Note: You don't need to rename indexes manually, but if you want cleaner names:
-- Uncomment the following lines to rename indexes:

-- ALTER INDEX idx_wards_ward_id RENAME TO idx_room_management_ward_id;
-- ALTER INDEX idx_wards_hospital_name RENAME TO idx_room_management_hospital_name;
-- ALTER INDEX idx_wards_created_at RENAME TO idx_room_management_created_at;
-- ALTER INDEX idx_wards_ward_type RENAME TO idx_room_management_ward_type;

-- Verify the rename was successful
SELECT * FROM room_management LIMIT 5;
