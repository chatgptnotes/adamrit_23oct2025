-- Test Junction Table Data for Invoice Display
-- Use this to verify data is available for visit H25F27004 (from screenshot)

-- Step 1: Check if visit exists
SELECT 'VISIT CHECK' as info;
SELECT 
    id as visit_uuid,
    visit_id,
    patient_name,
    admission_date,
    created_at
FROM visits 
WHERE visit_id = 'H25F27004';

-- Step 2: Check mandatory services junction table data
SELECT 'MANDATORY SERVICES JUNCTION DATA' as info;
SELECT 
    vms.id,
    vms.quantity,
    vms.rate_used,
    vms.rate_type,
    vms.amount,
    vms.selected_at,
    ms.service_name
FROM visit_mandatory_services vms
JOIN visits v ON vms.visit_id = v.id
JOIN mandatory_services ms ON vms.mandatory_service_id = ms.id
WHERE v.visit_id = 'H25F27004'
ORDER BY vms.selected_at DESC;

-- Step 3: Check clinical services junction table data
SELECT 'CLINICAL SERVICES JUNCTION DATA' as info;
SELECT 
    vcs.id,
    vcs.quantity,
    vcs.rate_used,
    vcs.rate_type,
    vcs.amount,
    vcs.selected_at,
    cs.service_name
FROM visit_clinical_services vcs
JOIN visits v ON vcs.visit_id = v.id
JOIN clinical_services cs ON vcs.clinical_service_id = cs.id
WHERE v.visit_id = 'H25F27004'
ORDER BY vcs.selected_at DESC;

-- Step 4: Expected Invoice Items Query (what Invoice.tsx will fetch)
SELECT 'EXPECTED INVOICE ITEMS' as info;
WITH visit_data AS (
    SELECT id as visit_uuid, visit_id
    FROM visits 
    WHERE visit_id = 'H25F27004'
),
mandatory_items AS (
    SELECT 
        'Mandatory Service' as type,
        ms.service_name as item_name,
        vms.rate_used as rate,
        vms.quantity as qty,
        vms.amount,
        1 as sort_order
    FROM visit_data vd
    JOIN visit_mandatory_services vms ON vd.visit_uuid = vms.visit_id
    JOIN mandatory_services ms ON vms.mandatory_service_id = ms.id
),
clinical_items AS (
    SELECT 
        'Clinical Service' as type,
        cs.service_name as item_name,
        vcs.rate_used as rate,
        vcs.quantity as qty,
        vcs.amount,
        2 as sort_order
    FROM visit_data vd
    JOIN visit_clinical_services vcs ON vd.visit_uuid = vcs.visit_id
    JOIN clinical_services cs ON vcs.clinical_service_id = cs.id
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY sort_order, item_name) as sr_no,
    type,
    item_name,
    rate,
    qty,
    amount
FROM (
    SELECT * FROM mandatory_items
    UNION ALL
    SELECT * FROM clinical_items
) combined_services
ORDER BY sort_order, item_name;

-- Step 5: Total calculation
SELECT 'TOTAL CALCULATION' as info;
WITH visit_data AS (
    SELECT id as visit_uuid, visit_id
    FROM visits 
    WHERE visit_id = 'H25F27004'
)
SELECT 
    COALESCE(
        (SELECT SUM(amount) FROM visit_mandatory_services vms WHERE vms.visit_id = (SELECT visit_uuid FROM visit_data)), 
        0
    ) as mandatory_total,
    COALESCE(
        (SELECT SUM(amount) FROM visit_clinical_services vcs WHERE vcs.visit_id = (SELECT visit_uuid FROM visit_data)), 
        0
    ) as clinical_total,
    COALESCE(
        (SELECT SUM(amount) FROM visit_mandatory_services vms WHERE vms.visit_id = (SELECT visit_uuid FROM visit_data)), 
        0
    ) + COALESCE(
        (SELECT SUM(amount) FROM visit_clinical_services vcs WHERE vcs.visit_id = (SELECT visit_uuid FROM visit_data)), 
        0
    ) as grand_total;

-- Step 6: Test with other recent visits if H25F27004 has no data
SELECT 'ALTERNATIVE VISITS WITH JUNCTION DATA' as info;
SELECT DISTINCT
    v.visit_id,
    v.patient_name,
    'Has Mandatory Services: ' || CASE WHEN vms.id IS NOT NULL THEN 'YES' ELSE 'NO' END as mandatory_status,
    'Has Clinical Services: ' || CASE WHEN vcs.id IS NOT NULL THEN 'YES' ELSE 'NO' END as clinical_status
FROM visits v
LEFT JOIN visit_mandatory_services vms ON v.id = vms.visit_id
LEFT JOIN visit_clinical_services vcs ON v.id = vcs.visit_id
WHERE v.visit_id IS NOT NULL
    AND (vms.id IS NOT NULL OR vcs.id IS NOT NULL)
ORDER BY v.created_at DESC
LIMIT 5;

SELECT 'INVOICE JUNCTION DATA TEST COMPLETE' as status;