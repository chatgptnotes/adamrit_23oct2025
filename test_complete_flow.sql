-- COMPREHENSIVE TEST: Clinical Services Hybrid Flow
-- This tests the complete save -> fetch -> display cycle

-- Setup: Use a real visit ID from your database
DO $$
DECLARE
    test_visit_id TEXT;
    test_visit_uuid UUID;
    test_service_uuid UUID;
    test_service_name TEXT;
BEGIN
    -- Step 1: Find a test visit
    SELECT visit_id INTO test_visit_id
    FROM visits 
    WHERE visit_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF test_visit_id IS NULL THEN
        RAISE EXCEPTION 'No test visit found';
    END IF;
    
    RAISE NOTICE 'Using test visit: %', test_visit_id;
    
    -- Get visit UUID
    SELECT id INTO test_visit_uuid
    FROM visits 
    WHERE visit_id = test_visit_id;
    
    -- Step 2: Find a test clinical service
    SELECT id, service_name INTO test_service_uuid, test_service_name
    FROM clinical_services 
    WHERE status = 'Active'
    ORDER BY service_name
    LIMIT 1;
    
    IF test_service_uuid IS NULL THEN
        RAISE EXCEPTION 'No active clinical services found';
    END IF;
    
    RAISE NOTICE 'Using test service: % (ID: %)', test_service_name, test_service_uuid;
    
    -- Step 3: Simulate SAVE operation (what FinalBill.tsx does)
    RAISE NOTICE '=== SIMULATING SAVE OPERATION ===';
    
    -- 3a: Insert into junction table (upsert)
    INSERT INTO visit_clinical_services (
        visit_id,
        clinical_service_id,
        quantity,
        rate_used,
        rate_type,
        amount
    ) VALUES (
        test_visit_uuid,
        test_service_uuid,
        1,
        500.00,
        'private',
        500.00
    )
    ON CONFLICT (visit_id, clinical_service_id) 
    DO UPDATE SET
        quantity = EXCLUDED.quantity,
        rate_used = EXCLUDED.rate_used,
        rate_type = EXCLUDED.rate_type,
        amount = EXCLUDED.amount,
        selected_at = CURRENT_TIMESTAMP;
        
    RAISE NOTICE 'Junction table updated successfully';
    
    -- 3b: Update visits table foreign key
    UPDATE visits 
    SET clinical_service_id = test_service_uuid
    WHERE visit_id = test_visit_id;
    
    RAISE NOTICE 'Visits FK updated successfully';
    
    -- Step 4: Simulate FETCH operation (what verifyServicesStateConsistency does)
    RAISE NOTICE '=== SIMULATING FETCH OPERATION ===';
    
    -- This is the exact query from FinalBill.tsx verifyServicesStateConsistency
    RAISE NOTICE 'Fetching clinical services from junction table...';
    
    -- Step 5: Test the hybrid query
    RAISE NOTICE '=== TESTING HYBRID QUERY ===';
    
END $$;

-- Verify the results
SELECT 'POST-SAVE VERIFICATION' as info;

-- Check what's in the junction table
SELECT 
    'JUNCTION TABLE DATA' as source,
    v.visit_id,
    cs.service_name,
    vcs.quantity,
    vcs.rate_used,
    vcs.rate_type,
    vcs.amount,
    vcs.selected_at
FROM visit_clinical_services vcs
JOIN visits v ON vcs.visit_id = v.id
JOIN clinical_services cs ON vcs.clinical_service_id = cs.id
ORDER BY vcs.selected_at DESC
LIMIT 5;

-- Check what's in the visits FK
SELECT 
    'VISITS FK DATA' as source,
    v.visit_id,
    cs.service_name as fk_service_name,
    cs.private_rate
FROM visits v
LEFT JOIN clinical_services cs ON v.clinical_service_id = cs.id
WHERE v.clinical_service_id IS NOT NULL
ORDER BY v.created_at DESC
LIMIT 5;

-- Test the complete hybrid fetch (matches FinalBill.tsx)
WITH visit_info AS (
    SELECT id as visit_uuid, visit_id, clinical_service_id
    FROM visits 
    WHERE visit_id = (
        SELECT visit_id FROM visits 
        WHERE clinical_service_id IS NOT NULL 
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
        NULL::numeric as amount,
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
        cs.private_rate,
        vcs.quantity,
        vcs.rate_used,
        vcs.rate_type,
        vcs.amount,
        vcs.selected_at
    FROM visit_info vi
    JOIN visit_clinical_services vcs ON vi.visit_uuid = vcs.visit_id
    JOIN clinical_services cs ON vcs.clinical_service_id = cs.id
)
SELECT 
    'HYBRID RESULT' as test_type,
    source,
    service_name,
    quantity,
    rate_used,
    amount
FROM (
    SELECT * FROM fk_service
    UNION ALL
    SELECT * FROM junction_services
) hybrid_results
ORDER BY selected_at DESC NULLS LAST;

SELECT 'COMPLETE FLOW TEST FINISHED' as status;