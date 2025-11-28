-- Create Hope and Ayushman anaesthetist tables
-- This migration adds anaesthetist management for both hospitals

-- ========================================
-- CREATE HOPE ANAESTHETISTS TABLE
-- ========================================

-- Create hope_anaesthetists table
CREATE TABLE IF NOT EXISTS public.hope_anaesthetists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    department VARCHAR(255),
    contact_info TEXT,
    tpa_rate DECIMAL(10,2),
    non_nabh_rate DECIMAL(10,2),
    nabh_rate DECIMAL(10,2),
    private_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now (following the pattern of other medical staff tables)
ALTER TABLE public.hope_anaesthetists DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hope_anaesthetists_name ON public.hope_anaesthetists(name);
CREATE INDEX IF NOT EXISTS idx_hope_anaesthetists_specialty ON public.hope_anaesthetists(specialty);
CREATE INDEX IF NOT EXISTS idx_hope_anaesthetists_department ON public.hope_anaesthetists(department);
CREATE INDEX IF NOT EXISTS idx_hope_anaesthetists_created_at ON public.hope_anaesthetists(created_at);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_hope_anaesthetists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hope_anaesthetists_updated_at
    BEFORE UPDATE ON public.hope_anaesthetists
    FOR EACH ROW
    EXECUTE FUNCTION update_hope_anaesthetists_updated_at();

-- Grant permissions
GRANT ALL ON public.hope_anaesthetists TO authenticated;
GRANT ALL ON public.hope_anaesthetists TO service_role;

-- ========================================
-- CREATE AYUSHMAN ANAESTHETISTS TABLE
-- ========================================

-- Create ayushman_anaesthetists table
CREATE TABLE IF NOT EXISTS public.ayushman_anaesthetists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    department VARCHAR(255),
    contact_info TEXT,
    tpa_rate DECIMAL(10,2),
    non_nabh_rate DECIMAL(10,2),
    nabh_rate DECIMAL(10,2),
    private_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now (following the pattern of other medical staff tables)
ALTER TABLE public.ayushman_anaesthetists DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ayushman_anaesthetists_name ON public.ayushman_anaesthetists(name);
CREATE INDEX IF NOT EXISTS idx_ayushman_anaesthetists_specialty ON public.ayushman_anaesthetists(specialty);
CREATE INDEX IF NOT EXISTS idx_ayushman_anaesthetists_department ON public.ayushman_anaesthetists(department);
CREATE INDEX IF NOT EXISTS idx_ayushman_anaesthetists_created_at ON public.ayushman_anaesthetists(created_at);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_ayushman_anaesthetists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ayushman_anaesthetists_updated_at
    BEFORE UPDATE ON public.ayushman_anaesthetists
    FOR EACH ROW
    EXECUTE FUNCTION update_ayushman_anaesthetists_updated_at();

-- Grant permissions
GRANT ALL ON public.ayushman_anaesthetists TO authenticated;
GRANT ALL ON public.ayushman_anaesthetists TO service_role;

-- ========================================
-- INSERT SAMPLE DATA
-- ========================================

-- Insert sample data for Hope anaesthetists
INSERT INTO public.hope_anaesthetists (name, specialty, department, contact_info) VALUES
('Dr. Anderson', 'Cardiac Anaesthesia', 'Anaesthesiology', 'anderson@hopehospital.com'),
('Dr. Brown', 'Neuroanesthesia', 'Anaesthesiology', 'brown@hopehospital.com'),
('Dr. Johnson', 'Pediatric Anaesthesia', 'Anaesthesiology', 'johnson@hopehospital.com'),
('Dr. Williams', 'Obstetric Anaesthesia', 'Anaesthesiology', 'williams@hopehospital.com'),
('Dr. Miller', 'Regional Anaesthesia', 'Anaesthesiology', 'miller@hopehospital.com'),
('Dr. Taylor', 'Pain Management', 'Anaesthesiology', 'taylor@hopehospital.com'),
('Dr. Wilson', 'Critical Care Anaesthesia', 'Anaesthesiology', 'wilson@hopehospital.com'),
('Dr. Moore', 'Trauma Anaesthesia', 'Anaesthesiology', 'moore@hopehospital.com');

-- Insert sample data for Ayushman anaesthetists
INSERT INTO public.ayushman_anaesthetists (name, specialty, department, contact_info) VALUES
('Dr. Garcia', 'General Anaesthesia', 'Anaesthesiology', 'garcia@ayushmanhospital.com'),
('Dr. Martinez', 'Cardiac Anaesthesia', 'Anaesthesiology', 'martinez@ayushmanhospital.com'),
('Dr. Lopez', 'Pediatric Anaesthesia', 'Anaesthesiology', 'lopez@ayushmanhospital.com'),
('Dr. Gonzalez', 'Neuroanesthesia', 'Anaesthesiology', 'gonzalez@ayushmanhospital.com'),
('Dr. Rodriguez', 'Obstetric Anaesthesia', 'Anaesthesiology', 'rodriguez@ayushmanhospital.com'),
('Dr. Hernandez', 'Regional Anaesthesia', 'Anaesthesiology', 'hernandez@ayushmanhospital.com'),
('Dr. Perez', 'Pain Management', 'Anaesthesiology', 'perez@ayushmanhospital.com'),
('Dr. Sanchez', 'Critical Care Anaesthesia', 'Anaesthesiology', 'sanchez@ayushmanhospital.com');

-- ========================================
-- ADD TABLE COMMENTS
-- ========================================

-- Add comments for documentation
COMMENT ON TABLE public.hope_anaesthetists IS 'Table to store Hope hospital anaesthetists information';
COMMENT ON COLUMN public.hope_anaesthetists.id IS 'Unique identifier for anaesthetist';
COMMENT ON COLUMN public.hope_anaesthetists.name IS 'Name of the anaesthetist';
COMMENT ON COLUMN public.hope_anaesthetists.specialty IS 'Anaesthesia specialty of the doctor';
COMMENT ON COLUMN public.hope_anaesthetists.department IS 'Department the anaesthetist belongs to';
COMMENT ON COLUMN public.hope_anaesthetists.contact_info IS 'Contact information for the anaesthetist';
COMMENT ON COLUMN public.hope_anaesthetists.tpa_rate IS 'Rate for TPA (Third Party Administrator) payments';
COMMENT ON COLUMN public.hope_anaesthetists.non_nabh_rate IS 'Rate for non-NABH payments';
COMMENT ON COLUMN public.hope_anaesthetists.nabh_rate IS 'Rate for NABH (National Accreditation Board for Hospitals) payments';
COMMENT ON COLUMN public.hope_anaesthetists.private_rate IS 'Rate for private payments';

COMMENT ON TABLE public.ayushman_anaesthetists IS 'Table to store Ayushman hospital anaesthetists information';
COMMENT ON COLUMN public.ayushman_anaesthetists.id IS 'Unique identifier for anaesthetist';
COMMENT ON COLUMN public.ayushman_anaesthetists.name IS 'Name of the anaesthetist';
COMMENT ON COLUMN public.ayushman_anaesthetists.specialty IS 'Anaesthesia specialty of the doctor';
COMMENT ON COLUMN public.ayushman_anaesthetists.department IS 'Department the anaesthetist belongs to';
COMMENT ON COLUMN public.ayushman_anaesthetists.contact_info IS 'Contact information for the anaesthetist';
COMMENT ON COLUMN public.ayushman_anaesthetists.tpa_rate IS 'Rate for TPA (Third Party Administrator) payments';
COMMENT ON COLUMN public.ayushman_anaesthetists.non_nabh_rate IS 'Rate for non-NABH payments';
COMMENT ON COLUMN public.ayushman_anaesthetists.nabh_rate IS 'Rate for NABH (National Accreditation Board for Hospitals) payments';
COMMENT ON COLUMN public.ayushman_anaesthetists.private_rate IS 'Rate for private payments';

-- Final verification
DO $$
DECLARE
    hope_count INTEGER;
    ayushman_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO hope_count FROM public.hope_anaesthetists;
    SELECT COUNT(*) INTO ayushman_count FROM public.ayushman_anaesthetists;

    RAISE NOTICE '=== ANAESTHETIST TABLES CREATED ===';
    RAISE NOTICE 'Hope anaesthetists: % records', hope_count;
    RAISE NOTICE 'Ayushman anaesthetists: % records', ayushman_count;
    RAISE NOTICE 'Anaesthetist management system is ready for both hospitals.';
END $$;