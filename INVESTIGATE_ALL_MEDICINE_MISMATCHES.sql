-- =====================================================
-- SAFE INVESTIGATION OF MEDICINE ID MISMATCHES
-- This investigates the scope of the problem across ALL medicines
-- =====================================================

-- Step 1: Count total medicines in each table
SELECT 'TOTAL COUNTS:' as analysis;
SELECT 'medicine_master total medicines:' as info, COUNT(*) as count 
FROM medicine_master WHERE is_deleted = false;

SELECT 'medicine_batch_inventory total records:' as info, COUNT(*) as count 
FROM medicine_batch_inventory WHERE is_active = true;

SELECT 'medicine_batch_inventory unique medicine_ids:' as info, COUNT(DISTINCT medicine_id) as count 
FROM medicine_batch_inventory WHERE is_active = true;

-- Step 2: Check UUID format in both tables
SELECT 'UUID FORMAT CHECK:' as analysis;
SELECT 'medicine_master id format:' as info, 
       LENGTH(id::text) as uuid_length,
       id::text as sample_id
FROM medicine_master 
WHERE is_deleted = false 
LIMIT 3;

SELECT 'medicine_batch_inventory medicine_id format:' as info,
       LENGTH(medicine_id::text) as uuid_length,
       medicine_id::text as sample_id
FROM medicine_batch_inventory 
WHERE is_active = true 
LIMIT 3;

-- Step 3: Find medicines with NO batch inventory
SELECT 'MEDICINES WITH NO BATCH INVENTORY:' as analysis;
SELECT COUNT(*) as count_without_batches,
       'out of total:' as info,
       (SELECT COUNT(*) FROM medicine_master WHERE is_deleted = false) as total_medicines
FROM medicine_master mm
LEFT JOIN medicine_batch_inventory mbi ON mm.id = mbi.medicine_id
WHERE mm.is_deleted = false 
  AND mbi.medicine_id IS NULL;

-- Step 4: Find batch inventory with NO matching medicine
SELECT 'BATCH INVENTORY WITH NO MATCHING MEDICINE:' as analysis;
SELECT COUNT(*) as count_orphaned_batches,
       'out of total:' as info,
       (SELECT COUNT(*) FROM medicine_batch_inventory WHERE is_active = true) as total_batches
FROM medicine_batch_inventory mbi
LEFT JOIN medicine_master mm ON mbi.medicine_id = mm.id
WHERE mbi.is_active = true 
  AND mm.id IS NULL;

-- Step 5: Show specific examples of mismatched records
SELECT 'SAMPLE MISMATCHED RECORDS:' as analysis;
SELECT 'Medicines without batches (first 5):' as info,
       mm.medicine_name,
       mm.id as medicine_master_id
FROM medicine_master mm
LEFT JOIN medicine_batch_inventory mbi ON mm.id = mbi.medicine_id
WHERE mm.is_deleted = false 
  AND mbi.medicine_id IS NULL
LIMIT 5;

SELECT 'Batches without medicines (first 5):' as info,
       mbi.medicine_id as batch_medicine_id,
       mbi.batch_number,
       mbi.current_stock
FROM medicine_batch_inventory mbi
LEFT JOIN medicine_master mm ON mbi.medicine_id = mm.id
WHERE mbi.is_active = true 
  AND mm.id IS NULL
LIMIT 5;

-- Step 6: Summary Analysis
SELECT 'SUMMARY ANALYSIS:' as final_analysis,
       'This will show if the problem is systemic or isolated' as note;