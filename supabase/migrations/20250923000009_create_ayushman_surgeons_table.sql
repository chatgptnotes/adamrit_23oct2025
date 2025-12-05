-- Create ayushman_surgeons table
CREATE TABLE IF NOT EXISTS public.ayushman_surgeons (
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

-- Disable RLS for now (following the pattern of clinical_services)
ALTER TABLE public.ayushman_surgeons DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ayushman_surgeons_name ON public.ayushman_surgeons(name);
CREATE INDEX IF NOT EXISTS idx_ayushman_surgeons_specialty ON public.ayushman_surgeons(specialty);
CREATE INDEX IF NOT EXISTS idx_ayushman_surgeons_department ON public.ayushman_surgeons(department);
CREATE INDEX IF NOT EXISTS idx_ayushman_surgeons_created_at ON public.ayushman_surgeons(created_at);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_ayushman_surgeons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ayushman_surgeons_updated_at
    BEFORE UPDATE ON public.ayushman_surgeons
    FOR EACH ROW
    EXECUTE FUNCTION update_ayushman_surgeons_updated_at();

-- Grant permissions
GRANT ALL ON public.ayushman_surgeons TO authenticated;
GRANT ALL ON public.ayushman_surgeons TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.ayushman_surgeons IS 'Table to store Ayushman hospital surgeons information';
COMMENT ON COLUMN public.ayushman_surgeons.id IS 'Unique identifier for surgeon';
COMMENT ON COLUMN public.ayushman_surgeons.name IS 'Name of the surgeon';
COMMENT ON COLUMN public.ayushman_surgeons.specialty IS 'Medical specialty of the surgeon';
COMMENT ON COLUMN public.ayushman_surgeons.department IS 'Department the surgeon belongs to';
COMMENT ON COLUMN public.ayushman_surgeons.contact_info IS 'Contact information for the surgeon';
COMMENT ON COLUMN public.ayushman_surgeons.tpa_rate IS 'Rate for TPA (Third Party Administrator) payments';
COMMENT ON COLUMN public.ayushman_surgeons.non_nabh_rate IS 'Rate for non-NABH payments';
COMMENT ON COLUMN public.ayushman_surgeons.nabh_rate IS 'Rate for NABH (National Accreditation Board for Hospitals) payments';
COMMENT ON COLUMN public.ayushman_surgeons.private_rate IS 'Rate for private payments';
COMMENT ON COLUMN public.ayushman_surgeons.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.ayushman_surgeons.updated_at IS 'Timestamp when record was last updated';