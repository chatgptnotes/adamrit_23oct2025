-- =====================================================
-- FIX MEDICINE ID RELATIONSHIPS BETWEEN TABLES
-- This fixes the broken foreign key relationships between
-- medicine_master.id and medicine_batch_inventory.medicine_id
-- =====================================================

-- Step 1: Investigate the current mismatch
-- Show medicines that exist in medicine_master but have no batch inventory
SELECT 
    'Medicines in medicine_master with NO batch inventory:' as info,
    mm.id as medicine_master_id,
    mm.medicine_name,
    mm.generic_name
FROM medicine_master mm
LEFT JOIN medicine_batch_inventory mbi ON mm.id = mbi.medicine_id
WHERE mm.is_deleted = false
  AND mbi.medicine_id IS NULL
LIMIT 10;

-- Step 2: Show batch inventory that doesn't match any medicine_master
SELECT 
    'Batch inventory with NO matching medicine_master:' as info,
    mbi.medicine_id as batch_medicine_id,
    mbi.batch_number,
    mbi.current_stock,
    mbi.id as batch_id
FROM medicine_batch_inventory mbi
LEFT JOIN medicine_master mm ON mbi.medicine_id = mm.id
WHERE mm.id IS NULL
  AND mbi.is_active = true
LIMIT 10;

-- Step 3: Try to find matches by medicine name
-- This will help us understand if medicines exist with different IDs
SELECT 
    'Potential matches by name:' as info,
    mm.id as medicine_master_id,
    mm.medicine_name as master_name,
    mbi.medicine_id as batch_medicine_id,
    mbi.batch_number,
    mbi.current_stock
FROM medicine_master mm
INNER JOIN medicine_batch_inventory mbi ON 
    UPPER(TRIM(mm.medicine_name)) = UPPER(TRIM(
        -- Try to extract medicine name from batch data if available
        COALESCE(
            (SELECT m2.medicine_name 
             FROM medicine_master m2 
             WHERE m2.id = mbi.medicine_id), 
            'UNKNOWN'
        )
    ))
WHERE mm.is_deleted = false
  AND mbi.is_active = true
LIMIT 10;

-- Step 4: Show summary of the mismatch problem
SELECT 
    'SUMMARY:' as analysis,
    (SELECT COUNT(*) FROM medicine_master WHERE is_deleted = false) as total_medicines,
    (SELECT COUNT(DISTINCT medicine_id) FROM medicine_batch_inventory WHERE is_active = true) as total_batch_medicine_ids,
    (SELECT COUNT(*) 
     FROM medicine_master mm 
     INNER JOIN medicine_batch_inventory mbi ON mm.id = mbi.medicine_id 
     WHERE mm.is_deleted = false AND mbi.is_active = true) as matching_records;

-- =====================================================
-- MANUAL REVIEW REQUIRED BEFORE RUNNING UPDATES
-- =====================================================
-- The above queries will help identify the scope of the problem.
-- Based on the results, you may need to:
-- 1. Update medicine_batch_inventory.medicine_id to match medicine_master.id
-- 2. Clean up orphaned records
-- 3. Create missing batch inventory records

-- Example update (DO NOT RUN without reviewing data first):
-- UPDATE medicine_batch_inventory 
-- SET medicine_id = (
--     SELECT mm.id 
--     FROM medicine_master mm 
--     WHERE UPPER(TRIM(mm.medicine_name)) = 'A-CEF 1GM INJ - CEFTRIAXONE 1 GM'
--     AND mm.is_deleted = false
--     LIMIT 1
-- )
-- WHERE batch_number = '02' 
--   AND current_stock = 60;