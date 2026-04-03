-- Fix pharmacy_sales.payment_status column to support discount approval workflow
-- The column was VARCHAR(20) which cannot hold 'PENDING_DISCOUNT_APPROVAL' (25 chars)
-- Also update CHECK constraint to include the new status value

-- Step 1: Drop existing check constraint
ALTER TABLE pharmacy_sales DROP CONSTRAINT IF EXISTS pharmacy_sales_payment_status_check;

-- Step 2: Alter column type to VARCHAR(30)
ALTER TABLE pharmacy_sales ALTER COLUMN payment_status TYPE VARCHAR(30);

-- Step 3: Add updated check constraint with new status
ALTER TABLE pharmacy_sales ADD CONSTRAINT pharmacy_sales_payment_status_check
  CHECK (payment_status IN ('PENDING', 'COMPLETED', 'REFUNDED', 'CANCELLED', 'PENDING_DISCOUNT_APPROVAL'));
