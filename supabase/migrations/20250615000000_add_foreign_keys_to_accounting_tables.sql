-- Add foreign key constraints to accounting tables for user references
-- This fixes the "Could not find a relationship between vouchers and users" error

-- Step 1: Add missing columns if they don't exist
-- Add columns to vouchers table (if missing)
ALTER TABLE public.vouchers
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS authorised_by UUID;

-- Add columns to voucher_types table (if missing)
ALTER TABLE public.voucher_types
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Add columns to patient_ledgers table (if missing)
ALTER TABLE public.patient_ledgers
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Step 2: Add foreign key constraints to vouchers table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_created_by_fkey'
    ) THEN
        ALTER TABLE public.vouchers
        ADD CONSTRAINT vouchers_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_authorised_by_fkey'
    ) THEN
        ALTER TABLE public.vouchers
        ADD CONSTRAINT vouchers_authorised_by_fkey
        FOREIGN KEY (authorised_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 3: Add foreign key constraints to voucher_types table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'voucher_types_created_by_fkey'
    ) THEN
        ALTER TABLE public.voucher_types
        ADD CONSTRAINT voucher_types_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 4: Add foreign key constraints to patient_ledgers table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'patient_ledgers_created_by_fkey'
    ) THEN
        ALTER TABLE public.patient_ledgers
        ADD CONSTRAINT patient_ledgers_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'patient_ledgers_updated_by_fkey'
    ) THEN
        ALTER TABLE public.patient_ledgers
        ADD CONSTRAINT patient_ledgers_updated_by_fkey
        FOREIGN KEY (updated_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 5: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vouchers_created_by ON public.vouchers(created_by);
CREATE INDEX IF NOT EXISTS idx_vouchers_authorised_by ON public.vouchers(authorised_by);
CREATE INDEX IF NOT EXISTS idx_voucher_types_created_by ON public.voucher_types(created_by);
CREATE INDEX IF NOT EXISTS idx_patient_ledgers_created_by ON public.patient_ledgers(created_by);
CREATE INDEX IF NOT EXISTS idx_patient_ledgers_updated_by ON public.patient_ledgers(updated_by);
