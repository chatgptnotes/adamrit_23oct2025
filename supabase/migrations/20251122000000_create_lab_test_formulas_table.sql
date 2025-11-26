-- ========================================================
-- CREATE lab_test_formulas TABLE
-- ========================================================
-- Migration Date: 2025-11-22
-- Description: Creates lab_test_formulas table to store formulas separately
--              from lab_test_config to avoid schema cache issues and support
--              lab-specific formula configurations.
--
-- Note: Foreign key constraint to lab table is not included to avoid
--       dependency issues. This allows the table to be created independently.
-- ========================================================

-- ========================================================
-- IMPORTANT: Drop existing table if it exists
-- ========================================================
-- This ensures a clean slate and proper column structure
-- WARNING: This will delete any existing formula data
DROP TABLE IF EXISTS public.lab_test_formulas CASCADE;

-- ========================================================
-- Create lab_test_formulas table with correct structure
-- ========================================================
CREATE TABLE IF NOT EXISTS public.lab_test_formulas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lab_id UUID NOT NULL,
    test_name TEXT NOT NULL,
    sub_test_name TEXT NOT NULL,
    formula TEXT NULL,
    test_type TEXT DEFAULT 'Numeric' CHECK (test_type IN ('Numeric', 'Text')),
    text_value TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint to prevent duplicate formulas for same test
    CONSTRAINT unique_lab_test_formula UNIQUE(lab_id, test_name, sub_test_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_test_formulas_lab_id
    ON public.lab_test_formulas(lab_id);

CREATE INDEX IF NOT EXISTS idx_lab_test_formulas_test_name
    ON public.lab_test_formulas(test_name);

CREATE INDEX IF NOT EXISTS idx_lab_test_formulas_lab_test
    ON public.lab_test_formulas(lab_id, test_name);

-- Add comments for documentation
COMMENT ON TABLE public.lab_test_formulas IS
'Stores calculation formulas and test type information for lab tests.
Formulas can reference other sub-test names for auto-calculation.';

COMMENT ON COLUMN public.lab_test_formulas.formula IS
'Formula for auto-calculating test values. Can reference other sub-test names.
Example: "(Haemoglobin/Packed Cell Volume*100)"';

COMMENT ON COLUMN public.lab_test_formulas.test_type IS
'Type of test result: "Numeric" for numerical values or "Text" for text-based results.
Default is "Numeric".';

COMMENT ON COLUMN public.lab_test_formulas.text_value IS
'Default or expected text value for Text type tests.
Only applicable when test_type is "Text".';

-- Enable Row Level Security
ALTER TABLE public.lab_test_formulas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.lab_test_formulas;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.lab_test_formulas;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users"
    ON public.lab_test_formulas
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow read access for all users"
    ON public.lab_test_formulas
    FOR SELECT
    USING (true);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lab_test_formulas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_lab_test_formulas_timestamp ON public.lab_test_formulas;

-- Create trigger to auto-update updated_at on row updates
CREATE TRIGGER update_lab_test_formulas_timestamp
    BEFORE UPDATE ON public.lab_test_formulas
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_test_formulas_updated_at();
