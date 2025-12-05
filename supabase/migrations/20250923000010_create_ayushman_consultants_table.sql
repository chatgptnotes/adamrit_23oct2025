-- Create ayushman_consultants table
CREATE TABLE IF NOT EXISTS public.ayushman_consultants (
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
ALTER TABLE public.ayushman_consultants DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ayushman_consultants_name ON public.ayushman_consultants(name);
CREATE INDEX IF NOT EXISTS idx_ayushman_consultants_specialty ON public.ayushman_consultants(specialty);
CREATE INDEX IF NOT EXISTS idx_ayushman_consultants_department ON public.ayushman_consultants(department);
CREATE INDEX IF NOT EXISTS idx_ayushman_consultants_created_at ON public.ayushman_consultants(created_at);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_ayushman_consultants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ayushman_consultants_updated_at
    BEFORE UPDATE ON public.ayushman_consultants
    FOR EACH ROW
    EXECUTE FUNCTION update_ayushman_consultants_updated_at();

-- Grant permissions
GRANT ALL ON public.ayushman_consultants TO authenticated;
GRANT ALL ON public.ayushman_consultants TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.ayushman_consultants IS 'Table to store Ayushman hospital consultants information';
COMMENT ON COLUMN public.ayushman_consultants.id IS 'Unique identifier for consultant';
COMMENT ON COLUMN public.ayushman_consultants.name IS 'Name of the consultant';
COMMENT ON COLUMN public.ayushman_consultants.specialty IS 'Medical specialty of the consultant';
COMMENT ON COLUMN public.ayushman_consultants.department IS 'Department the consultant belongs to';
COMMENT ON COLUMN public.ayushman_consultants.contact_info IS 'Contact information for the consultant';
COMMENT ON COLUMN public.ayushman_consultants.tpa_rate IS 'Rate for TPA (Third Party Administrator) payments';
COMMENT ON COLUMN public.ayushman_consultants.non_nabh_rate IS 'Rate for non-NABH payments';
COMMENT ON COLUMN public.ayushman_consultants.nabh_rate IS 'Rate for NABH (National Accreditation Board for Hospitals) payments';
COMMENT ON COLUMN public.ayushman_consultants.private_rate IS 'Rate for private payments';
COMMENT ON COLUMN public.ayushman_consultants.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.ayushman_consultants.updated_at IS 'Timestamp when record was last updated';