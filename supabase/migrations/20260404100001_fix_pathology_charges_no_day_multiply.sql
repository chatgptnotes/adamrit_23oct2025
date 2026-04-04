-- Fix: Pathology charges should NOT multiply rate by number of days in date range.
-- The date range is just for record-keeping (which dates the charges cover),
-- not a multiplier for the amount.
-- Previously: days = end_date - start_date + 1, amount = days * rate (WRONG)
-- Now: qty (user-editable, default 1), amount = qty * rate

-- Step 1: Drop the generated columns
ALTER TABLE visit_pathology_charges DROP COLUMN IF EXISTS days;
ALTER TABLE visit_pathology_charges DROP COLUMN IF EXISTS amount;

-- Step 2: Re-add as regular columns
ALTER TABLE visit_pathology_charges ADD COLUMN qty INTEGER NOT NULL DEFAULT 1;
ALTER TABLE visit_pathology_charges ADD COLUMN amount NUMERIC(10,2) NOT NULL DEFAULT 0;
