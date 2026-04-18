-- Add is_hidden column to visit_labs for soft-hiding wrongly entered tests
ALTER TABLE visit_labs ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

COMMENT ON COLUMN visit_labs.is_hidden IS 'Hide wrongly entered tests from bill display — any user can hide, admin can unhide';
