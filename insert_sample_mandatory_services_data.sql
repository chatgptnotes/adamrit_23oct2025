-- Insert Sample Data into Mandatory Services Junction Table
-- This script adds sample data for testing the junction table functionality

-- Step 1: Check current status
SELECT 'CURRENT STATUS CHECK' as info;
SELECT 
    'VISITS' as table_name,
    COUNT(*) as total_records,
    COUNT(mandatory_service_id) as with_mandatory_service
FROM visits
WHERE visit_id IS NOT NULL

UNION ALL

SELECT 
    'MANDATORY_SERVICES' as table_name,
    COUNT(*) as total_records,
    COUNT(*) as available_services
FROM mandatory_services
WHERE status = 'Active'

UNION ALL

SELECT 
    'JUNCTION_TABLE' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT visit_id) as unique_visits
FROM visit_mandatory_services;

-- Step 2: Get sample data for insertion
SELECT 'SAMPLE DATA FOR INSERTION' as info;
SELECT 
    'VISITS_SAMPLE' as type,
    v.visit_id,
    v.id as visit_uuid,
    v.patient_name,
    v.mandatory_service_id as current_fk
FROM visits v
WHERE v.visit_id IS NOT NULL
ORDER BY v.created_at DESC
LIMIT 3

UNION ALL

SELECT 
    'SERVICES_SAMPLE' as type,
    ms.service_name,
    ms.id::text as service_uuid,
    ms.private_rate::text as private_rate,
    ms.status
FROM mandatory_services ms
WHERE ms.status = 'Active'
ORDER BY ms.service_name
LIMIT 3;

-- Step 3: Insert sample data (if needed)
-- WARNING: Only run this if you need sample data for testing!
DO $$
DECLARE
    sample_visit_record RECORD;
    sample_service_record RECORD;
    inserted_count INTEGER := 0;
BEGIN
    -- Get a sample visit that doesn't already have junction table data
    SELECT v.id, v.visit_id, v.patient_name
    INTO sample_visit_record
    FROM visits v
    LEFT JOIN visit_mandatory_services vms ON v.id = vms.visit_id
    WHERE v.visit_id IS NOT NULL
        AND vms.id IS NULL  -- No existing junction data
    ORDER BY v.created_at DESC
    LIMIT 1;
    
    IF sample_visit_record.id IS NULL THEN
        RAISE NOTICE 'No suitable visit found for sample data insertion';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using sample visit: % (UUID: %)', sample_visit_record.visit_id, sample_visit_record.id;
    
    -- Insert 2-3 sample mandatory services for this visit
    FOR sample_service_record IN
        SELECT id, service_name, private_rate, tpa_rate, nabh_rate, non_nabh_rate
        FROM mandatory_services
        WHERE status = 'Active'
        ORDER BY service_name
        LIMIT 2  -- Insert 2 services for testing
    LOOP
        -- Insert into junction table
        INSERT INTO visit_mandatory_services (
            visit_id,
            mandatory_service_id,
            quantity,
            rate_used,
            rate_type,
            amount
        ) VALUES (
            sample_visit_record.id,
            sample_service_record.id,
            1,
            COALESCE(sample_service_record.private_rate, sample_service_record.tpa_rate, 0.00),
            CASE 
                WHEN sample_service_record.private_rate IS NOT NULL THEN 'private'
                WHEN sample_service_record.tpa_rate IS NOT NULL THEN 'tpa'
                ELSE 'private'
            END,
            COALESCE(sample_service_record.private_rate, sample_service_record.tpa_rate, 0.00)
        )
        ON CONFLICT (visit_id, mandatory_service_id) DO NOTHING;
        
        inserted_count := inserted_count + 1;
        RAISE NOTICE 'Inserted sample service: % (Rate: %)', 
            sample_service_record.service_name,
            COALESCE(sample_service_record.private_rate, sample_service_record.tpa_rate, 0.00);
    END LOOP;
    
    -- Also update the FK for the first service (hybrid approach)
    UPDATE visits 
    SET mandatory_service_id = (
        SELECT mandatory_service_id 
        FROM visit_mandatory_services 
        WHERE visit_id = sample_visit_record.id 
        ORDER BY created_at ASC 
        LIMIT 1
    )
    WHERE id = sample_visit_record.id;
    
    RAISE NOTICE 'Sample data insertion completed. Inserted % services for visit %', 
        inserted_count, sample_visit_record.visit_id;
END $$;

-- Step 4: Verify sample data insertion
SELECT 'SAMPLE DATA VERIFICATION' as info;
SELECT 
    v.visit_id,
    v.patient_name,
    ms.service_name,
    vms.quantity,
    vms.rate_used,
    vms.rate_type,
    vms.amount,
    vms.created_at
FROM visit_mandatory_services vms
JOIN visits v ON vms.visit_id = v.id
JOIN mandatory_services ms ON vms.mandatory_service_id = ms.id
ORDER BY vms.created_at DESC
LIMIT 5;

-- Step 5: Show current data summary
SELECT 'FINAL DATA SUMMARY' as info;
SELECT 
    COUNT(*) as total_junction_records,
    COUNT(DISTINCT visit_id) as visits_with_services,
    COUNT(DISTINCT mandatory_service_id) as unique_services_used,
    ROUND(AVG(rate_used), 2) as avg_rate,
    SUM(amount) as total_amount
FROM visit_mandatory_services;

-- Step 6: Test hybrid query (like FinalBill.tsx will use)
SELECT 'HYBRID QUERY TEST' as info;
WITH sample_visit AS (
    SELECT id as visit_uuid, visit_id
    FROM visits
    WHERE id IN (SELECT DISTINCT visit_id FROM visit_mandatory_services)
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    v.visit_id,
    ms.service_name,
    vms.quantity,
    vms.rate_used,
    vms.rate_type,
    vms.amount,
    'JUNCTION_TABLE' as source
FROM sample_visit v
JOIN visit_mandatory_services vms ON v.visit_uuid = vms.visit_id
JOIN mandatory_services ms ON vms.mandatory_service_id = ms.id
ORDER BY vms.selected_at DESC;

SELECT 'SAMPLE MANDATORY SERVICES DATA INSERTION COMPLETE!' as final_status;