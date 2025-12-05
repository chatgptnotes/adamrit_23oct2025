-- Add foreign key arrays to visits table for multiple clinical and mandatory services
-- This approach allows multiple services per visit using UUID arrays

-- Add clinical_service_ids array column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS clinical_service_ids UUID[] DEFAULT '{}';

-- Add mandatory_service_ids array column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS mandatory_service_ids UUID[] DEFAULT '{}';

-- Add service details as JSONB for rates and amounts
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS clinical_services_details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mandatory_services_details JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better performance on arrays
CREATE INDEX IF NOT EXISTS idx_visits_clinical_service_ids ON public.visits USING gin (clinical_service_ids);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_service_ids ON public.visits USING gin (mandatory_service_ids);
CREATE INDEX IF NOT EXISTS idx_visits_clinical_services_details ON public.visits USING gin (clinical_services_details);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_services_details ON public.visits USING gin (mandatory_services_details);

-- Add foreign key constraints using array elements (PostgreSQL specific)
-- Note: This creates a constraint that each UUID in the array must exist in the referenced table
ALTER TABLE public.visits
ADD CONSTRAINT fk_visits_clinical_service_ids
CHECK (
    clinical_service_ids IS NULL OR
    NOT EXISTS (
        SELECT 1 FROM unnest(clinical_service_ids) AS id
        WHERE id NOT IN (SELECT id FROM public.clinical_services)
    )
);

ALTER TABLE public.visits
ADD CONSTRAINT fk_visits_mandatory_service_ids
CHECK (
    mandatory_service_ids IS NULL OR
    NOT EXISTS (
        SELECT 1 FROM unnest(mandatory_service_ids) AS id
        WHERE id NOT IN (SELECT id FROM public.mandatory_services)
    )
);

-- Add comments for documentation
COMMENT ON COLUMN public.visits.clinical_service_ids IS 'Array of foreign key references to clinical_services table';
COMMENT ON COLUMN public.visits.mandatory_service_ids IS 'Array of foreign key references to mandatory_services table';
COMMENT ON COLUMN public.visits.clinical_services_details IS 'JSONB array containing rate and amount details for each clinical service';
COMMENT ON COLUMN public.visits.mandatory_services_details IS 'JSONB array containing rate and amount details for each mandatory service';

-- Create helper functions to manage service arrays
CREATE OR REPLACE FUNCTION add_clinical_service_to_visit(
    p_visit_id UUID,
    p_service_id UUID,
    p_rate DECIMAL(10,2),
    p_rate_type VARCHAR(50),
    p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    service_detail JSONB;
BEGIN
    -- Create service detail object
    service_detail = jsonb_build_object(
        'service_id', p_service_id,
        'rate', p_rate,
        'rate_type', p_rate_type,
        'quantity', p_quantity,
        'amount', p_rate * p_quantity,
        'selected_at', now()
    );

    -- Update the visit
    UPDATE public.visits
    SET
        clinical_service_ids = array_append(
            COALESCE(clinical_service_ids, '{}'),
            p_service_id
        ),
        clinical_services_details =
            COALESCE(clinical_services_details, '[]'::jsonb) || service_detail
    WHERE id = p_visit_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_mandatory_service_to_visit(
    p_visit_id UUID,
    p_service_id UUID,
    p_rate DECIMAL(10,2),
    p_rate_type VARCHAR(50),
    p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    service_detail JSONB;
BEGIN
    -- Create service detail object
    service_detail = jsonb_build_object(
        'service_id', p_service_id,
        'rate', p_rate,
        'rate_type', p_rate_type,
        'quantity', p_quantity,
        'amount', p_rate * p_quantity,
        'selected_at', now()
    );

    -- Update the visit
    UPDATE public.visits
    SET
        mandatory_service_ids = array_append(
            COALESCE(mandatory_service_ids, '{}'),
            p_service_id
        ),
        mandatory_services_details =
            COALESCE(mandatory_services_details, '[]'::jsonb) || service_detail
    WHERE id = p_visit_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;