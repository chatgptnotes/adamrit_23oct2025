-- Create clinical_services table
CREATE TABLE IF NOT EXISTS public.clinical_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    tpa_rate DECIMAL(10,2),
    private_rate DECIMAL(10,2),
    nabh_rate DECIMAL(10,2),
    non_nabh_rate DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    hospital_name VARCHAR(255)
);

-- Create RLS (Row Level Security) policies
ALTER TABLE public.clinical_services ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to select clinical services
CREATE POLICY "Users can view clinical services" ON public.clinical_services
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert clinical services
CREATE POLICY "Users can insert clinical services" ON public.clinical_services
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = created_by
    );

-- Policy for authenticated users to update their own clinical services
CREATE POLICY "Users can update their own clinical services" ON public.clinical_services
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        auth.uid() = created_by
    );

-- Policy for authenticated users to delete their own clinical services
CREATE POLICY "Users can delete their own clinical services" ON public.clinical_services
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        auth.uid() = created_by
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clinical_services_service_name ON public.clinical_services(service_name);
CREATE INDEX IF NOT EXISTS idx_clinical_services_status ON public.clinical_services(status);
CREATE INDEX IF NOT EXISTS idx_clinical_services_hospital_name ON public.clinical_services(hospital_name);
CREATE INDEX IF NOT EXISTS idx_clinical_services_created_by ON public.clinical_services(created_by);
CREATE INDEX IF NOT EXISTS idx_clinical_services_created_at ON public.clinical_services(created_at);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_clinical_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clinical_services_updated_at
    BEFORE UPDATE ON public.clinical_services
    FOR EACH ROW
    EXECUTE FUNCTION update_clinical_services_updated_at();

-- Insert sample data split between ayushman and hope hospitals (lowercase)
INSERT INTO public.clinical_services (service_name, tpa_rate, private_rate, nabh_rate, non_nabh_rate, status, hospital_name) VALUES
('Cardiology Consultation', 2000.00, 3500.00, 1800.00, 2800.00, 'Active', 'ayushman'),
('Orthopedic Surgery', 25000.00, 45000.00, 22000.00, 38000.00, 'Active', 'ayushman'),
('Physiotherapy Session', 800.00, 1500.00, 700.00, 1200.00, 'Active', 'ayushman'),
('Dental Treatment', 1500.00, 2500.00, 1200.00, 2000.00, 'Active', 'ayushman'),
('Ophthalmology Check-up', 1000.00, 1800.00, 900.00, 1500.00, 'Active', 'hope'),
('Dermatology Consultation', 1200.00, 2000.00, 1000.00, 1700.00, 'Active', 'hope'),
('Psychiatry Session', 1800.00, 3000.00, 1500.00, 2500.00, 'Active', 'hope'),
('Rehabilitation Therapy', 2500.00, 4000.00, 2200.00, 3500.00, 'Active', 'hope');

-- Grant permissions
GRANT ALL ON public.clinical_services TO authenticated;
GRANT ALL ON public.clinical_services TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.clinical_services IS 'Table to store clinical service information with different rate structures';
COMMENT ON COLUMN public.clinical_services.id IS 'Unique identifier for clinical service';
COMMENT ON COLUMN public.clinical_services.service_name IS 'Name of the clinical service';
COMMENT ON COLUMN public.clinical_services.tpa_rate IS 'Rate for TPA (Third Party Administrator) payments';
COMMENT ON COLUMN public.clinical_services.private_rate IS 'Rate for private payments';
COMMENT ON COLUMN public.clinical_services.nabh_rate IS 'Rate for NABH (National Accreditation Board for Hospitals) payments';
COMMENT ON COLUMN public.clinical_services.non_nabh_rate IS 'Rate for non-NABH payments';
COMMENT ON COLUMN public.clinical_services.status IS 'Status of the service (Active, Inactive, Completed)';
COMMENT ON COLUMN public.clinical_services.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.clinical_services.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN public.clinical_services.created_by IS 'User who created this record';
COMMENT ON COLUMN public.clinical_services.hospital_name IS 'Name of the hospital this service belongs to';