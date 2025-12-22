-- =====================================================
-- FIX A-CEF MEDICINE ID MISMATCH
-- This fixes the specific medicine_id mismatch for A-CEF 1GM INJ
-- =====================================================

-- First, let's verify the current state
SELECT 'BEFORE FIX - medicine_master:' as info, id, medicine_name 
FROM medicine_master 
WHERE medicine_name ILIKE '%A-CEF 1GM INJ%' 
  AND is_deleted = false;

SELECT 'BEFORE FIX - medicine_batch_inventory:' as info, medicine_id, batch_number, current_stock 
FROM medicine_batch_inventory 
WHERE current_stock = 60 
  AND batch_number = '02';

-- The fix: Update medicine_batch_inventory to use the correct medicine_id
UPDATE medicine_batch_inventory 
SET medicine_id = '522f4fa2-f761-4d98-bd72-3b1e2f058fe0'
WHERE medicine_id = '880ab9dc-5694-4e64-ae9d-f9b45c35eea'
  AND batch_number = '02'
  AND current_stock = 60;

-- Verify the fix worked
SELECT 'AFTER FIX - Updated records:' as info, *, 
       (SELECT medicine_name FROM medicine_master WHERE id = medicine_id) as medicine_name_check
FROM medicine_batch_inventory 
WHERE medicine_id = '522f4fa2-f761-4d98-bd72-3b1e2f058fe0';

-- Test query that mimics what the Sales Bill search does
SELECT 'FINAL TEST - This should now work:' as info,
       mm.medicine_name,
       mbi.batch_number, 
       mbi.current_stock,
       mbi.selling_price
FROM medicine_master mm
INNER JOIN medicine_batch_inventory mbi ON mm.id = mbi.medicine_id
WHERE mm.medicine_name ILIKE '%A-CEF%'
  AND mm.is_deleted = false
  AND mbi.is_active = true
  AND mbi.current_stock > 0;