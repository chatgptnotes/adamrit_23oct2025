-- Migration: Add batch_inventory_id to direct_sale_bills for stock tracking
-- This links direct sales to batch inventory for proper stock management

-- Add batch_inventory_id column to direct_sale_bills
ALTER TABLE direct_sale_bills
ADD COLUMN IF NOT EXISTS batch_inventory_id UUID REFERENCES medicine_batch_inventory(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_direct_sale_bills_batch_inventory_id
ON direct_sale_bills(batch_inventory_id);

-- Add medicine_id column to link to medicine_master table
ALTER TABLE direct_sale_bills
ADD COLUMN IF NOT EXISTS medicine_id UUID REFERENCES medicine_master(id);

-- Add index for medicine_id
CREATE INDEX IF NOT EXISTS idx_direct_sale_bills_medicine_id
ON direct_sale_bills(medicine_id);

-- Comment on columns
COMMENT ON COLUMN direct_sale_bills.batch_inventory_id IS 'Reference to the batch from which stock was sold';
COMMENT ON COLUMN direct_sale_bills.medicine_id IS 'Reference to the medicine master record';
