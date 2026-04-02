-- Add status column to pharmacy_sales for soft-delete (cancel instead of delete)
ALTER TABLE pharmacy_sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add status column to purchase_orders if not exists
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';

COMMENT ON COLUMN pharmacy_sales.status IS 'active or cancelled — bills are never deleted for audit trail';
