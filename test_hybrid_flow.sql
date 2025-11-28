-- Test Hybrid Clinical Services Flow
-- This script tests the complete flow after FinalBill.tsx updates

-- 1. Check current table structures
SELECT 'VISITS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'visits' 
    AND table_schema = 'public'
    AND column_name IN ('id', 'visit_id', 'clinical_service_id')
ORDER BY ordinal_position;

SELECT 'JUNCTION TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'visit_clinical_services' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check sample visit for testing
SELECT 'SAMPLE VISIT FOR TESTING' as info;
SELECT id, visit_id, clinical_service_id, patient_name
FROM visits 
WHERE visit_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

-- 3. Check available clinical services
SELECT 'AVAILABLE CLINICAL SERVICES' as info;
SELECT id, service_name, private_rate, status
FROM clinical_services 
WHERE status = 'Active'
ORDER BY service_name
LIMIT 5;

-- 4. Test hybrid query (using sample visit D8270904 if exists)
SELECT 'HYBRID QUERY TEST' as info;
WITH visit_info AS (
    SELECT id as visit_uuid, visit_id, clinical_service_id
    FROM visits 
    WHERE visit_id = (
        SELECT visit_id FROM visits 
        WHERE visit_id IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 1
    )
),
fk_service AS (
    SELECT 
        'FK_APPROACH' as source,
        cs.id,
        cs.service_name,
        cs.private_rate,
        NULL::integer as quantity,
        NULL::numeric as rate_used,
        NULL::varchar as rate_type,
        NULL::numeric as amount
    FROM visit_info vi
    JOIN clinical_services cs ON vi.clinical_service_id = cs.id
    WHERE vi.clinical_service_id IS NOT NULL
),
junction_services AS (
    SELECT 
        'JUNCTION_APPROACH' as source,
        cs.id,
        cs.service_name,
        cs.private_rate,
        vcs.quantity,
        vcs.rate_used,
        vcs.rate_type,
        vcs.amount
    FROM visit_info vi
    JOIN visit_clinical_services vcs ON vi.visit_uuid = vcs.visit_id
    JOIN clinical_services cs ON vcs.clinical_service_id = cs.id
)
SELECT * FROM fk_service
UNION ALL
SELECT * FROM junction_services
ORDER BY source;

SELECT 'TEST COMPLETED' as status;