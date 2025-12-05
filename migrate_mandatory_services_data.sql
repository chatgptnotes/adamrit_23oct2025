-- Migrate Existing Mandatory Services Data to Junction Table
-- This script converts visits.mandatory_service_id FK data to visit_mandatory_services junction table

-- Step 1: Check current data status
SELECT 'CURRENT DATA STATUS' as info;
SELECT 
    COUNT(*) as total_visits,
    COUNT(mandatory_service_id) as visits_with_mandatory_service,
    COUNT(CASE WHEN mandatory_service_id IS NOT NULL THEN 1 END) as visits_to_migrate
FROM visits;

-- Step 2: Check junction table status  
SELECT 'JUNCTION TABLE STATUS' as info;
SELECT 
    COUNT(*) as current_junction_records,
    COUNT(DISTINCT visit_id) as unique_visits_in_junction,
    COUNT(DISTINCT mandatory_service_id) as unique_services_in_junction
FROM visit_mandatory_services;

-- Step 3: Preview migration data
SELECT 'MIGRATION PREVIEW' as info;
SELECT 
    v.visit_id,
    v.patient_name,
    ms.service_name,
    ms.private_rate,
    ms.tpa_rate,
    ms.nabh_rate,
    ms.non_nabh_rate,
    COALESCE(ms.private_rate, ms.tpa_rate, ms.nabh_rate, ms.non_nabh_rate, 0.00) as default_rate
FROM visits v
JOIN mandatory_services ms ON v.mandatory_service_id = ms.id
WHERE v.mandatory_service_id IS NOT NULL
ORDER BY v.created_at DESC
LIMIT 5;

-- Step 4: Perform the migration
DO $$
DECLARE
    visit_record RECORD;
    mandatory_service_record RECORD;
    default_rate DECIMAL(10,2);
    migrated_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting mandatory services migration...';
    
    -- Loop through all visits that have mandatory_service_id set
    FOR visit_record IN
        SELECT id, visit_id, mandatory_service_id, patient_name, created_at
        FROM visits
        WHERE mandatory_service_id IS NOT NULL
        ORDER BY created_at DESC
    LOOP
        BEGIN
            -- Get the mandatory service details
            SELECT id, service_name, private_rate, tpa_rate, nabh_rate, non_nabh_rate
            INTO mandatory_service_record
            FROM mandatory_services
            WHERE id = visit_record.mandatory_service_id;

            IF mandatory_service_record.id IS NULL THEN
                RAISE WARNING 'Mandatory service not found for visit %: service ID %', 
                    visit_record.visit_id, visit_record.mandatory_service_id;
                error_count := error_count + 1;
                CONTINUE;
            END IF;

            -- Determine best rate to use (priority: private > tpa > nabh > non_nabh)
            default_rate := COALESCE(
                mandatory_service_record.private_rate,
                mandatory_service_record.tpa_rate,
                mandatory_service_record.nabh_rate,
                mandatory_service_record.non_nabh_rate,
                0.00
            );

            -- Determine rate type based on which rate we're using
            DECLARE
                selected_rate_type VARCHAR(50) := 'private';
            BEGIN
                IF mandatory_service_record.private_rate IS NOT NULL AND mandatory_service_record.private_rate > 0 THEN
                    selected_rate_type := 'private';
                    default_rate := mandatory_service_record.private_rate;
                ELSIF mandatory_service_record.tpa_rate IS NOT NULL AND mandatory_service_record.tpa_rate > 0 THEN
                    selected_rate_type := 'tpa';
                    default_rate := mandatory_service_record.tpa_rate;
                ELSIF mandatory_service_record.nabh_rate IS NOT NULL AND mandatory_service_record.nabh_rate > 0 THEN
                    selected_rate_type := 'nabh';
                    default_rate := mandatory_service_record.nabh_rate;
                ELSIF mandatory_service_record.non_nabh_rate IS NOT NULL AND mandatory_service_record.non_nabh_rate > 0 THEN
                    selected_rate_type := 'non_nabh';
                    default_rate := mandatory_service_record.non_nabh_rate;
                END IF;

                -- Insert into junction table
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
                    selected_rate_type,
                    visit_record.created_at -- Use original visit creation time
                )
                ON CONFLICT (visit_id, mandatory_service_id) 
                DO UPDATE SET
                    quantity = EXCLUDED.quantity,
                    rate_used = EXCLUDED.rate_used,
                    rate_type = EXCLUDED.rate_type,
                    selected_at = EXCLUDED.selected_at,
                    updated_at = NOW();

                migrated_count := migrated_count + 1;
                
                -- Log every 10th migration
                IF migrated_count % 10 = 0 THEN
                    RAISE NOTICE 'Migrated % records...', migrated_count;
                END IF;
                
            END;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error migrating visit %: %', visit_record.visit_id, SQLERRM;
            error_count := error_count + 1;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migration completed!';
    RAISE NOTICE 'Successfully migrated: % records', migrated_count;
    RAISE NOTICE 'Errors encountered: % records', error_count;
END $$;

-- Step 5: Verify migration results
SELECT 'MIGRATION VERIFICATION' as info;
SELECT 
    COUNT(*) as total_junction_records,
    COUNT(DISTINCT visit_id) as unique_visits,
    COUNT(DISTINCT mandatory_service_id) as unique_services,
    AVG(rate_used) as avg_rate_used,
    SUM(amount) as total_amount
FROM visit_mandatory_services;

-- Step 6: Show sample migrated data
SELECT 'MIGRATED DATA SAMPLE' as info;
SELECT 
    v.visit_id,
    v.patient_name,
    ms.service_name,
    vms.quantity,
    vms.rate_used,
    vms.rate_type,
    vms.amount,
    vms.selected_at
FROM visit_mandatory_services vms
JOIN visits v ON vms.visit_id = v.id
JOIN mandatory_services ms ON vms.mandatory_service_id = ms.id
ORDER BY vms.created_at DESC
LIMIT 10;

-- Step 7: Compare FK vs Junction data
SELECT 'DATA COMPARISON' as info;
SELECT 
    'FK_APPROACH' as source,
    COUNT(*) as record_count,
    COUNT(DISTINCT v.id) as unique_visits
FROM visits v
WHERE v.mandatory_service_id IS NOT NULL

UNION ALL

SELECT 
    'JUNCTION_APPROACH' as source,
    COUNT(*) as record_count,
    COUNT(DISTINCT visit_id) as unique_visits
FROM visit_mandatory_services;

-- Step 8: Check for any missing migrations
SELECT 'MISSING MIGRATIONS CHECK' as info;
SELECT 
    v.visit_id,
    v.patient_name,
    ms.service_name as fk_service_name,
    'MISSING_IN_JUNCTION' as issue
FROM visits v
JOIN mandatory_services ms ON v.mandatory_service_id = ms.id
LEFT JOIN visit_mandatory_services vms ON v.id = vms.visit_id AND v.mandatory_service_id = vms.mandatory_service_id
WHERE v.mandatory_service_id IS NOT NULL 
    AND vms.id IS NULL
LIMIT 5;

SELECT 'MANDATORY SERVICES DATA MIGRATION COMPLETE!' as final_status;