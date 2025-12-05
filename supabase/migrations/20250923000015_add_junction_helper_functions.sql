-- Helper functions for visit_clinical_services junction table operations
-- These functions handle the conversion between visit_id (TEXT) and visits.id (UUID)

-- Function to get visits.id (UUID) from visit_id (TEXT)
CREATE OR REPLACE FUNCTION get_visit_uuid_from_visit_id(p_visit_id TEXT)
RETURNS UUID AS $$
DECLARE
    visit_uuid UUID;
BEGIN
    SELECT id INTO visit_uuid
    FROM public.visits
    WHERE visit_id = p_visit_id;

    RETURN visit_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to add clinical service to visit using TEXT visit_id
CREATE OR REPLACE FUNCTION add_clinical_service_to_visit_by_text_id(
    p_visit_id TEXT,
    p_clinical_service_id UUID,
    p_rate_used DECIMAL(10,2),
    p_rate_type VARCHAR(50),
    p_quantity INTEGER DEFAULT 1,
    p_external_requisition VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    visit_uuid UUID;
    junction_record_id UUID;
BEGIN
    -- Get the UUID from TEXT visit_id
    visit_uuid := get_visit_uuid_from_visit_id(p_visit_id);

    IF visit_uuid IS NULL THEN
        RAISE EXCEPTION 'Visit with visit_id % not found', p_visit_id;
    END IF;

    -- Insert into junction table
    INSERT INTO public.visit_clinical_services (
        visit_id,
        clinical_service_id,
        quantity,
        rate_used,
        rate_type,
        external_requisition
    ) VALUES (
        visit_uuid,
        p_clinical_service_id,
        p_quantity,
        p_rate_used,
        p_rate_type,
        p_external_requisition
    )
    RETURNING id INTO junction_record_id;

    RETURN junction_record_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get all clinical services for a visit using TEXT visit_id
CREATE OR REPLACE FUNCTION get_clinical_services_for_visit(p_visit_id TEXT)
RETURNS TABLE (
    junction_id UUID,
    service_id UUID,
    service_name VARCHAR(255),
    quantity INTEGER,
    rate_used DECIMAL(10,2),
    rate_type VARCHAR(50),
    amount DECIMAL(10,2),
    external_requisition VARCHAR(100),
    selected_at TIMESTAMP WITH TIME ZONE,
    tpa_rate DECIMAL(10,2),
    private_rate DECIMAL(10,2),
    nabh_rate DECIMAL(10,2),
    non_nabh_rate DECIMAL(10,2)
) AS $$
DECLARE
    visit_uuid UUID;
BEGIN
    -- Get the UUID from TEXT visit_id
    visit_uuid := get_visit_uuid_from_visit_id(p_visit_id);

    IF visit_uuid IS NULL THEN
        RAISE EXCEPTION 'Visit with visit_id % not found', p_visit_id;
    END IF;

    -- Return clinical services with details
    RETURN QUERY
    SELECT
        vcs.id as junction_id,
        cs.id as service_id,
        cs.service_name,
        vcs.quantity,
        vcs.rate_used,
        vcs.rate_type,
        vcs.amount,
        vcs.external_requisition,
        vcs.selected_at,
        cs.tpa_rate,
        cs.private_rate,
        cs.nabh_rate,
        cs.non_nabh_rate
    FROM public.visit_clinical_services vcs
    JOIN public.clinical_services cs ON vcs.clinical_service_id = cs.id
    WHERE vcs.visit_id = visit_uuid
    ORDER BY vcs.selected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to remove clinical service from visit using TEXT visit_id
CREATE OR REPLACE FUNCTION remove_clinical_service_from_visit(
    p_visit_id TEXT,
    p_clinical_service_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    visit_uuid UUID;
    rows_affected INTEGER;
BEGIN
    -- Get the UUID from TEXT visit_id
    visit_uuid := get_visit_uuid_from_visit_id(p_visit_id);

    IF visit_uuid IS NULL THEN
        RAISE EXCEPTION 'Visit with visit_id % not found', p_visit_id;
    END IF;

    -- Delete from junction table
    DELETE FROM public.visit_clinical_services
    WHERE visit_id = visit_uuid
    AND clinical_service_id = p_clinical_service_id;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;

    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update clinical service in visit
CREATE OR REPLACE FUNCTION update_clinical_service_in_visit(
    p_visit_id TEXT,
    p_clinical_service_id UUID,
    p_rate_used DECIMAL(10,2) DEFAULT NULL,
    p_rate_type VARCHAR(50) DEFAULT NULL,
    p_quantity INTEGER DEFAULT NULL,
    p_external_requisition VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    visit_uuid UUID;
    rows_affected INTEGER;
BEGIN
    -- Get the UUID from TEXT visit_id
    visit_uuid := get_visit_uuid_from_visit_id(p_visit_id);

    IF visit_uuid IS NULL THEN
        RAISE EXCEPTION 'Visit with visit_id % not found', p_visit_id;
    END IF;

    -- Update junction table (only update non-null parameters)
    UPDATE public.visit_clinical_services
    SET
        rate_used = COALESCE(p_rate_used, rate_used),
        rate_type = COALESCE(p_rate_type, rate_type),
        quantity = COALESCE(p_quantity, quantity),
        external_requisition = COALESCE(p_external_requisition, external_requisition),
        updated_at = NOW()
    WHERE visit_id = visit_uuid
    AND clinical_service_id = p_clinical_service_id;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;

    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get total amount for all clinical services in a visit
CREATE OR REPLACE FUNCTION get_visit_clinical_services_total(p_visit_id TEXT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    visit_uuid UUID;
    total_amount DECIMAL(10,2);
BEGIN
    -- Get the UUID from TEXT visit_id
    visit_uuid := get_visit_uuid_from_visit_id(p_visit_id);

    IF visit_uuid IS NULL THEN
        RETURN 0;
    END IF;

    -- Calculate total amount
    SELECT COALESCE(SUM(amount), 0) INTO total_amount
    FROM public.visit_clinical_services
    WHERE visit_id = visit_uuid;

    RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for these functions
GRANT EXECUTE ON FUNCTION get_visit_uuid_from_visit_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_clinical_service_to_visit_by_text_id(TEXT, UUID, DECIMAL, VARCHAR, INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_clinical_services_for_visit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_clinical_service_from_visit(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_clinical_service_in_visit(TEXT, UUID, DECIMAL, VARCHAR, INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_visit_clinical_services_total(TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_visit_uuid_from_visit_id(TEXT) IS 'Convert TEXT visit_id to UUID for junction table operations';
COMMENT ON FUNCTION add_clinical_service_to_visit_by_text_id(TEXT, UUID, DECIMAL, VARCHAR, INTEGER, VARCHAR) IS 'Add clinical service to visit using TEXT visit_id';
COMMENT ON FUNCTION get_clinical_services_for_visit(TEXT) IS 'Get all clinical services for a visit with full details';
COMMENT ON FUNCTION remove_clinical_service_from_visit(TEXT, UUID) IS 'Remove clinical service from visit';
COMMENT ON FUNCTION update_clinical_service_in_visit(TEXT, UUID, DECIMAL, VARCHAR, INTEGER, VARCHAR) IS 'Update clinical service details in visit';
COMMENT ON FUNCTION get_visit_clinical_services_total(TEXT) IS 'Calculate total amount for all clinical services in a visit';