-- Create visit_clinical_services junction table for proper many-to-many relationship
-- This replaces the JSONB storage in visits table with proper relational structure

-- Create the junction table
CREATE TABLE IF NOT EXISTS public.visit_clinical_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    clinical_service_id UUID NOT NULL REFERENCES clinical_services(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    rate_used DECIMAL(10,2) NOT NULL CHECK (rate_used >= 0),
    rate_type VARCHAR(50) NOT NULL CHECK (rate_type IN ('tpa', 'private', 'nabh', 'non_nabh')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    external_requisition VARCHAR(100), -- For external requisition information
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(visit_id, clinical_service_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visit_clinical_services_visit_id ON public.visit_clinical_services(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_clinical_services_service_id ON public.visit_clinical_services(clinical_service_id);
CREATE INDEX IF NOT EXISTS idx_visit_clinical_services_rate_type ON public.visit_clinical_services(rate_type);
CREATE INDEX IF NOT EXISTS idx_visit_clinical_services_selected_at ON public.visit_clinical_services(selected_at);
CREATE INDEX IF NOT EXISTS idx_visit_clinical_services_amount ON public.visit_clinical_services(amount);

-- Enable Row Level Security (RLS)
ALTER TABLE public.visit_clinical_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view visit clinical services" ON public.visit_clinical_services
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert visit clinical services" ON public.visit_clinical_services
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update visit clinical services" ON public.visit_clinical_services
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete visit clinical services" ON public.visit_clinical_services
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_visit_clinical_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_visit_clinical_services_updated_at
    BEFORE UPDATE ON public.visit_clinical_services
    FOR EACH ROW
    EXECUTE FUNCTION update_visit_clinical_services_updated_at();

-- Grant permissions
GRANT ALL ON public.visit_clinical_services TO authenticated;
GRANT ALL ON public.visit_clinical_services TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.visit_clinical_services IS 'Junction table linking visits to clinical services (many-to-many relationship)';
COMMENT ON COLUMN public.visit_clinical_services.id IS 'Unique identifier for visit-clinical service relationship';
COMMENT ON COLUMN public.visit_clinical_services.visit_id IS 'Foreign key referencing visits table';
COMMENT ON COLUMN public.visit_clinical_services.clinical_service_id IS 'Foreign key referencing clinical_services table';
COMMENT ON COLUMN public.visit_clinical_services.quantity IS 'Number of times this service was provided';
COMMENT ON COLUMN public.visit_clinical_services.rate_used IS 'The actual rate used for billing this service';
COMMENT ON COLUMN public.visit_clinical_services.rate_type IS 'Type of rate used (tpa, private, nabh, non_nabh)';
COMMENT ON COLUMN public.visit_clinical_services.amount IS 'Total amount for this service (rate_used * quantity)';
COMMENT ON COLUMN public.visit_clinical_services.external_requisition IS 'External requisition information if applicable';
COMMENT ON COLUMN public.visit_clinical_services.selected_at IS 'Timestamp when this service was selected for the visit';
COMMENT ON COLUMN public.visit_clinical_services.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.visit_clinical_services.updated_at IS 'Timestamp when record was last updated';

-- Create a function to automatically calculate amount when rate_used or quantity changes
CREATE OR REPLACE FUNCTION calculate_clinical_service_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.amount = NEW.rate_used * NEW.quantity;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_clinical_service_amount
    BEFORE INSERT OR UPDATE ON public.visit_clinical_services
    FOR EACH ROW
    EXECUTE FUNCTION calculate_clinical_service_amount();

-- Migration script to convert existing JSONB data to junction table
-- This will be run in a separate migration after application code is updated
/*
DO $$
DECLARE
    visit_record RECORD;
    service_data JSONB;
    service_item JSONB;
    clinical_service_record RECORD;
BEGIN
    -- Loop through all visits that have clinical_services data
    FOR visit_record IN
        SELECT id, visit_id, clinical_services
        FROM visits
        WHERE clinical_services IS NOT NULL
        AND clinical_services != 'null'::jsonb
        AND clinical_services != '[]'::jsonb
    LOOP
        -- Parse the JSONB array
        FOR service_item IN
            SELECT jsonb_array_elements(visit_record.clinical_services)
        LOOP
            -- Find matching clinical service by name
            SELECT id INTO clinical_service_record
            FROM clinical_services
            WHERE service_name = (service_item->>'service_name')
            LIMIT 1;

            -- If found, insert into junction table
            IF clinical_service_record.id IS NOT NULL THEN
                INSERT INTO visit_clinical_services (
                    visit_id,
                    clinical_service_id,
                    quantity,
                    rate_used,
                    rate_type,
                    external_requisition,
                    selected_at
                ) VALUES (
                    visit_record.id,
                    clinical_service_record.id,
                    COALESCE((service_item->>'quantity')::INTEGER, 1),
                    (service_item->>'selectedRate')::DECIMAL,
                    COALESCE(service_item->>'rateType', 'private'),
                    service_item->>'external_requisition',
                    COALESCE((service_item->>'selected_at')::TIMESTAMP WITH TIME ZONE, NOW())
                )
                ON CONFLICT (visit_id, clinical_service_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;
*/