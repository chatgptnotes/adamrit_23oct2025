-- Complete Clinical Services Data Flow Implementation
-- Hybrid approach: Junction table + Foreign Key in visits table

-- 1. CHECK current data status
SELECT 
    'CURRENT DATA STATUS' as info,
    (SELECT COUNT(*) FROM clinical_services WHERE status = 'Active') as available_services,
    (SELECT COUNT(*) FROM visit_clinical_services) as junction_records,
    (SELECT COUNT(*) FROM visits WHERE clinical_service_id IS NOT NULL) as visits_with_fk
;

-- 2. VERIFY table structures
SELECT 
    'CLINICAL_SERVICES STRUCTURE' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clinical_services' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'VISIT_CLINICAL_SERVICES STRUCTURE' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'visit_clinical_services' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. CHECK visits table FK column
SELECT 
    'VISITS FK COLUMN' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'visits' 
    AND table_schema = 'public'
    AND column_name = 'clinical_service_id';

-- 4. SAMPLE DATA QUERIES
-- Check available clinical services
SELECT 
    'AVAILABLE CLINICAL SERVICES' as info,
    id,
    service_name,
    tpa_rate,
    private_rate,
    nabh_rate,
    non_nabh_rate,
    status
FROM clinical_services 
WHERE status = 'Active'
ORDER BY service_name
LIMIT 10;

-- 5. CHECK specific visit data (replace with actual visit_id)
-- Update 'D8270904' with your actual visit ID from screenshot
SELECT 
    'VISIT DATA CHECK' as info,
    visit_id,
    patient_name,
    clinical_service_id,
    mandatory_service_id,
    created_at
FROM visits 
WHERE visit_id = 'D8270904';

-- Get visit UUID for junction table queries
SELECT 
    'VISIT UUID' as info,
    id as visit_uuid,
    visit_id as visit_text_id
FROM visits 
WHERE visit_id = 'D8270904';

-- 6. HYBRID FETCH QUERY (Main Query for FinalBill.tsx)
-- This query fetches from BOTH FK and junction table
WITH visit_info AS (
    SELECT id as visit_uuid, visit_id, clinical_service_id
    FROM visits 
    WHERE visit_id = 'D8270904'
),
fk_service AS (
    SELECT 
        'FK_APPROACH' as source,
        cs.id,
        cs.service_name,
        cs.tpa_rate,
        cs.private_rate,
        cs.nabh_rate,
        cs.non_nabh_rate,
        NULL::integer as quantity,
        NULL::numeric as rate_used,
        NULL::varchar as rate_type,
        NULL::numeric as amount,
        NULL::varchar as external_requisition,
        NULL::timestamp as selected_at
    FROM visit_info vi
    JOIN clinical_services cs ON vi.clinical_service_id = cs.id
    WHERE vi.clinical_service_id IS NOT NULL
),
junction_services AS (
    SELECT 
        'JUNCTION_APPROACH' as source,
        cs.id,
        cs.service_name,
        cs.tpa_rate,
        cs.private_rate,
        cs.nabh_rate,
        cs.non_nabh_rate,
        vcs.quantity,
        vcs.rate_used,
        vcs.rate_type,
        vcs.amount,
        vcs.external_requisition,
        vcs.selected_at
    FROM visit_info vi
    JOIN visit_clinical_services vcs ON vi.visit_uuid = vcs.visit_id
    JOIN clinical_services cs ON vcs.clinical_service_id = cs.id
)
SELECT * FROM fk_service
UNION ALL
SELECT * FROM junction_services
ORDER BY selected_at DESC NULLS LAST;

-- 7. INSERT SAMPLE DATA (for testing - only if no data exists)
-- WARNING: Only run this if you need test data!
/*
-- Insert sample clinical service data
DO $$
DECLARE
    sample_visit_uuid UUID;
    sample_service_uuid UUID;
BEGIN
    -- Get visit UUID
    SELECT id INTO sample_visit_uuid 
    FROM visits 
    WHERE visit_id = 'D8270904' 
    LIMIT 1;
    
    -- Get a sample service UUID
    SELECT id INTO sample_service_uuid 
    FROM clinical_services 
    WHERE status = 'Active' 
    LIMIT 1;
    
    -- Insert into junction table (if data doesn't exist)
    INSERT INTO visit_clinical_services (
        visit_id,
        clinical_service_id,
        quantity,
        rate_used,
        rate_type,
        amount
    ) VALUES (
        sample_visit_uuid,
        sample_service_uuid,
        1,
        500.00,
        'private',
        500.00
    )
    ON CONFLICT (visit_id, clinical_service_id) DO NOTHING;
    
    -- Update visits FK (if not already set)
    UPDATE visits 
    SET clinical_service_id = sample_service_uuid
    WHERE id = sample_visit_uuid 
        AND clinical_service_id IS NULL;
        
    RAISE NOTICE 'Sample data inserted successfully';
END $$;
*/

-- 8. VERIFICATION QUERIES after data insertion
-- Check if data was inserted correctly
SELECT 
    'VERIFICATION AFTER INSERT' as info,
    v.visit_id,
    v.clinical_service_id as fk_service_id,
    cs1.service_name as fk_service_name,
    COUNT(vcs.id) as junction_services_count,
    STRING_AGG(cs2.service_name, ', ') as junction_service_names
FROM visits v
LEFT JOIN clinical_services cs1 ON v.clinical_service_id = cs1.id
LEFT JOIN visit_clinical_services vcs ON v.id = vcs.visit_id
LEFT JOIN clinical_services cs2 ON vcs.clinical_service_id = cs2.id
WHERE v.visit_id = 'D8270904'
GROUP BY v.id, v.visit_id, v.clinical_service_id, cs1.service_name;

-- 9. SUPABASE QUERY EXAMPLES FOR FINALBILL.TSX
/*
JavaScript/TypeScript queries for FinalBill.tsx:

// Step 1: Get visit with FK service
const { data: visitData } = await supabase
  .from('visits')
  .select(`
    id,
    visit_id,
    clinical_service_id,
    clinical_service:clinical_services(id, service_name, tpa_rate, private_rate, nabh_rate, non_nabh_rate)
  `)
  .eq('visit_id', visitId)
  .single();

// Step 2: Get junction table services
const { data: junctionServices } = await supabase
  .from('visit_clinical_services')
  .select(`
    id,
    quantity,
    rate_used,
    rate_type,
    amount,
    external_requisition,
    selected_at,
    clinical_services!clinical_service_id(id, service_name, tpa_rate, private_rate, nabh_rate, non_nabh_rate)
  `)
  .eq('visit_id', visitData.id);

// Step 3: Combine both sources
let allServices = [];
if (visitData?.clinical_service) {
  allServices.push(visitData.clinical_service);
}
if (junctionServices?.length > 0) {
  allServices = allServices.concat(junctionServices.map(j => ({
    ...j.clinical_services,
    quantity: j.quantity,
    rate_used: j.rate_used,
    rate_type: j.rate_type,
    amount: j.amount
  })));
}
*/

-- 10. CLEANUP QUERIES (if needed)
-- Use these to reset data for testing
/*
-- Delete test junction data
DELETE FROM visit_clinical_services 
WHERE visit_id = (SELECT id FROM visits WHERE visit_id = 'D8270904');

-- Clear FK reference
UPDATE visits 
SET clinical_service_id = NULL 
WHERE visit_id = 'D8270904';
*/

SELECT 'CLINICAL SERVICES FLOW QUERIES COMPLETE' as status;