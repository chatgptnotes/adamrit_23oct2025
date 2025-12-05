-- SQL queries to fix final_payments table issues

-- Step 1: Check for duplicate visit_ids
SELECT visit_id, COUNT(*) as count
FROM final_payments
GROUP BY visit_id
HAVING COUNT(*) > 1;

-- Step 2: Delete all records for a specific visit_id (if needed)
-- Replace 'IH25I24001' with the actual visit_id
DELETE FROM final_payments
WHERE visit_id = 'IH25I24001';

-- Step 3: Add unique constraint to visit_id (if not already added)
ALTER TABLE public.final_payments
ADD CONSTRAINT final_payments_visit_id_key UNIQUE (visit_id);

-- Step 4: Verify the constraint was added
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'final_payments' AND constraint_type = 'UNIQUE';
