-- Run this script to create the discharge summary tables
-- Execute this in your Supabase SQL editor or psql

-- Check if tables already exist
SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('discharge_summaries', 'discharge_medications', 'discharge_examinations', 'discharge_surgery_details');

-- If tables don't exist, run the migration
-- Copy and paste the content from: supabase/migrations/20250927000000_create_discharge_summary_tables.sql

-- After running the migration, verify tables were created
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_name IN ('discharge_summaries', 'discharge_medications', 'discharge_examinations', 'discharge_surgery_details')
ORDER BY t.table_name, c.ordinal_position;