-- Manual fix for database schema to resolve "clinical_service_rate" error
-- Run this SQL script directly in your Supabase dashboard or psql

-- Step 1: Drop any problematic functions and triggers
DROP FUNCTION IF EXISTS add_clinical_service_to_visit(UUID, UUID, DECIMAL, VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS add_mandatory_service_to_visit(UUID, UUID, DECIMAL, VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS calculate_clinical_service_amount() CASCADE;
DROP TABLE IF EXISTS public.visit_clinical_services CASCADE;

-- Step 2: Ensure the visits table has the correct columns
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS clinical_service_id UUID;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS mandatory_service_id UUID;

-- Step 3: Add foreign key constraints if the referenced tables exist
DO $$
BEGIN
    -- Add foreign key for clinical_service_id if clinical_services table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinical_services') THEN
        BEGIN
            ALTER TABLE public.visits
            ADD CONSTRAINT fk_visits_clinical_service_id
            FOREIGN KEY (clinical_service_id) REFERENCES public.clinical_services(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, skip
            NULL;
        END;
    END IF;

    -- Add foreign key for mandatory_service_id if mandatory_services table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mandatory_services') THEN
        BEGIN
            ALTER TABLE public.visits
            ADD CONSTRAINT fk_visits_mandatory_service_id
            FOREIGN KEY (mandatory_service_id) REFERENCES public.mandatory_services(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, skip
            NULL;
        END;
    END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_clinical_service_id ON public.visits(clinical_service_id);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_service_id ON public.visits(mandatory_service_id);

-- Step 5: Ensure JSONB columns exist for backward compatibility
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS clinical_services JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS mandatory_services JSONB DEFAULT '[]'::jsonb;

-- Step 6: Create indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_visits_clinical_services ON public.visits USING gin (clinical_services);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_services ON public.visits USING gin (mandatory_services);

-- Step 7: Verify the schema
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'visits'
AND column_name IN ('clinical_service_id', 'mandatory_service_id', 'clinical_services', 'mandatory_services')
ORDER BY column_name;

-- Success message
SELECT 'Schema fix completed successfully! The visits table should now have UUID foreign key columns.' as status;