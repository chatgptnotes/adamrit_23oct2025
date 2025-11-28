-- Create visit_mandatory_services junction table for proper many-to-many relationship
-- This replaces the single FK storage in visits table with proper relational structure
-- Based on the same pattern as visit_clinical_services table

-- Create the junction table
CREATE TABLE IF NOT EXISTS public.visit_mandatory_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    mandatory_service_id UUID NOT NULL REFERENCES mandatory_services(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    rate_used DECIMAL(10,2) NOT NULL CHECK (rate_used >= 0),
    rate_type VARCHAR(50) NOT NULL CHECK (rate_type IN ('tpa', 'private', 'nabh', 'non_nabh')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    external_requisition VARCHAR(100), -- For external requisition information
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(visit_id, mandatory_service_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visit_mandatory_services_visit_id ON public.visit_mandatory_services(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_mandatory_services_service_id ON public.visit_mandatory_services(mandatory_service_id);
CREATE INDEX IF NOT EXISTS idx_visit_mandatory_services_rate_type ON public.visit_mandatory_services(rate_type);
CREATE INDEX IF NOT EXISTS idx_visit_mandatory_services_selected_at ON public.visit_mandatory_services(selected_at);
CREATE INDEX IF NOT EXISTS idx_visit_mandatory_services_amount ON public.visit_mandatory_services(amount);

-- Enable Row Level Security (RLS)
ALTER TABLE public.visit_mandatory_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view visit mandatory services" ON public.visit_mandatory_services
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert visit mandatory services" ON public.visit_mandatory_services
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update visit mandatory services" ON public.visit_mandatory_services
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete visit mandatory services" ON public.visit_mandatory_services
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_visit_mandatory_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_visit_mandatory_services_updated_at
    BEFORE UPDATE ON public.visit_mandatory_services
    FOR EACH ROW
    EXECUTE FUNCTION update_visit_mandatory_services_updated_at();

-- Grant permissions
GRANT ALL ON public.visit_mandatory_services TO authenticated;
GRANT ALL ON public.visit_mandatory_services TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.visit_mandatory_services IS 'Junction table linking visits to mandatory services (many-to-many relationship)';
COMMENT ON COLUMN public.visit_mandatory_services.id IS 'Unique identifier for visit-mandatory service relationship';
COMMENT ON COLUMN public.visit_mandatory_services.visit_id IS 'Foreign key referencing visits table';
COMMENT ON COLUMN public.visit_mandatory_services.mandatory_service_id IS 'Foreign key referencing mandatory_services table';
COMMENT ON COLUMN public.visit_mandatory_services.quantity IS 'Number of times this service was provided';
COMMENT ON COLUMN public.visit_mandatory_services.rate_used IS 'The actual rate used for billing this service';
COMMENT ON COLUMN public.visit_mandatory_services.rate_type IS 'Type of rate used (tpa, private, nabh, non_nabh)';
COMMENT ON COLUMN public.visit_mandatory_services.amount IS 'Total amount for this service (rate_used * quantity)';
COMMENT ON COLUMN public.visit_mandatory_services.external_requisition IS 'External requisition information if applicable';
COMMENT ON COLUMN public.visit_mandatory_services.selected_at IS 'Timestamp when this service was selected for the visit';
COMMENT ON COLUMN public.visit_mandatory_services.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.visit_mandatory_services.updated_at IS 'Timestamp when record was last updated';

-- Create a function to automatically calculate amount when rate_used or quantity changes
CREATE OR REPLACE FUNCTION calculate_mandatory_service_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.amount = NEW.rate_used * NEW.quantity;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_mandatory_service_amount
    BEFORE INSERT OR UPDATE ON public.visit_mandatory_services
    FOR EACH ROW
    EXECUTE FUNCTION calculate_mandatory_service_amount();

-- Migration script to convert existing FK data to junction table
-- This migrates data from visits.mandatory_service_id to the junction table
DO $$
DECLARE
    visit_record RECORD;
    mandatory_service_record RECORD;
    default_rate DECIMAL(10,2);
BEGIN
    -- Loop through all visits that have mandatory_service_id set
    FOR visit_record IN
        SELECT id, visit_id, mandatory_service_id
        FROM visits
        WHERE mandatory_service_id IS NOT NULL
    LOOP
        -- Get the mandatory service details
        SELECT id, service_name, private_rate, tpa_rate, nabh_rate, non_nabh_rate
        INTO mandatory_service_record
        FROM mandatory_services
        WHERE id = visit_record.mandatory_service_id;

        -- Use private rate as default, fallback to other rates
        default_rate := COALESCE(
            mandatory_service_record.private_rate,
            mandatory_service_record.tpa_rate,
            mandatory_service_record.nabh_rate,
            mandatory_service_record.non_nabh_rate,
            0.00
        );

        -- Insert into junction table if service exists
        IF mandatory_service_record.id IS NOT NULL THEN
            INSERT INTO visit_mandatory_services (
                visit_id,
                mandatory_service_id,
                quantity,
                rate_used,
                rate_type,
                selected_at
            ) VALUES (
                visit_record.id,
                mandatory_service_record.id,
                1, -- Default quantity
                default_rate,
                'private', -- Default rate type
                NOW()
            )
            ON CONFLICT (visit_id, mandatory_service_id) DO NOTHING;

            RAISE NOTICE 'Migrated mandatory service for visit %: % (Rate: %)', 
                visit_record.visit_id, 
                mandatory_service_record.service_name, 
                default_rate;
        END IF;
    END LOOP;
    
    -- Show migration summary
    RAISE NOTICE 'Migration completed. Total junction records: %', 
        (SELECT COUNT(*) FROM visit_mandatory_services);
END $$;

-- Verification queries
SELECT 'MANDATORY SERVICES JUNCTION TABLE CREATED' as status;

-- Show table structure
SELECT 'TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'visit_mandatory_services' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show migration results
SELECT 'MIGRATION RESULTS' as info;
SELECT 
    COUNT(*) as total_junction_records,
    COUNT(DISTINCT visit_id) as unique_visits,
    COUNT(DISTINCT mandatory_service_id) as unique_services
FROM visit_mandatory_services;

-- Show sample data
SELECT 'SAMPLE DATA' as info;
SELECT 
    v.visit_id,
    ms.service_name,
    vms.quantity,
    vms.rate_used,
    vms.rate_type,
    vms.amount
FROM visit_mandatory_services vms
JOIN visits v ON vms.visit_id = v.id
JOIN mandatory_services ms ON vms.mandatory_service_id = ms.id
ORDER BY vms.created_at DESC
LIMIT 5;

SELECT 'MANDATORY SERVICES JUNCTION SETUP COMPLETE!' as final_status;