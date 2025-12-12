-- Migration: Add file upload columns to lab_results table
-- This allows storing PDF and image files associated with lab test results

ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);

-- Add index for file queries
CREATE INDEX IF NOT EXISTS idx_lab_results_file_path ON lab_results(file_path);

-- Create storage bucket for lab files (if using Supabase CLI)
-- Note: This needs to be done via Supabase Dashboard or using the storage API
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('lab-files', 'lab-files', false, 10485760)
-- ON CONFLICT (id) DO NOTHING;
