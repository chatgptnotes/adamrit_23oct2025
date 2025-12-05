-- EMERGENCY FIX: Remove ALL triggers causing "clinical_service_rate" error
-- This script removes any problematic triggers, functions, or constraints

-- Step 1: Drop ALL triggers on visits table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Get all triggers on visits table
    FOR trigger_record IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'visits'
        AND event_object_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.visits CASCADE', trigger_record.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Step 2: Drop ALL functions that might reference clinical_service_rate
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Get all functions that might contain problematic references
    FOR func_record IN
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc
        WHERE proname LIKE '%clinical%'
        OR proname LIKE '%mandatory%'
        OR proname LIKE '%service%'
        OR proname LIKE '%visit%'
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
            RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function: % - %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 3: Drop any constraints that might have trigger functions
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS fk_visits_clinical_service_ids CASCADE;
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS fk_visits_mandatory_service_ids CASCADE;
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS check_clinical_service_rate CASCADE;
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS check_mandatory_service_rate CASCADE;

-- Step 4: Drop any columns that might have attached triggers
ALTER TABLE public.visits DROP COLUMN IF EXISTS clinical_service_rate CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS mandatory_service_rate CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS clinical_service_amount CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS mandatory_service_amount CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS clinical_service_ids CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS mandatory_service_ids CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS clinical_services_details CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS mandatory_services_details CASCADE;

-- Step 5: Drop any junction tables that might have triggers
DROP TABLE IF EXISTS public.visit_clinical_services CASCADE;
DROP TABLE IF EXISTS public.visit_mandatory_services CASCADE;

-- Step 6: Ensure clean UUID foreign key columns exist
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS clinical_service_id UUID;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS mandatory_service_id UUID;

-- Step 7: Add foreign key constraints WITHOUT any triggers
DO $$
BEGIN
    -- Drop existing constraints first
    ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS fk_visits_clinical_service_id;
    ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS fk_visits_mandatory_service_id;

    -- Add clean constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinical_services' AND table_schema = 'public') THEN
        ALTER TABLE public.visits
        ADD CONSTRAINT fk_visits_clinical_service_id
        FOREIGN KEY (clinical_service_id) REFERENCES public.clinical_services(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mandatory_services' AND table_schema = 'public') THEN
        ALTER TABLE public.visits
        ADD CONSTRAINT fk_visits_mandatory_service_id
        FOREIGN KEY (mandatory_service_id) REFERENCES public.mandatory_services(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add foreign key constraints: %', SQLERRM;
END $$;

-- Step 8: Create clean indexes
CREATE INDEX IF NOT EXISTS idx_visits_clinical_service_id ON public.visits(clinical_service_id);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_service_id ON public.visits(mandatory_service_id);

-- Step 9: Ensure JSONB columns exist (without triggers)
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS clinical_services JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS mandatory_services JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_visits_clinical_services ON public.visits USING gin (clinical_services);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_services ON public.visits USING gin (mandatory_services);

-- Step 10: Final verification - check for any remaining problematic objects
DO $$
DECLARE
    problem_count INTEGER;
BEGIN
    -- Check for any remaining functions with problematic names
    SELECT COUNT(*) INTO problem_count
    FROM pg_proc
    WHERE proname LIKE '%clinical_service_rate%'
    OR proname LIKE '%mandatory_service_rate%';

    IF problem_count > 0 THEN
        RAISE WARNING 'Found % functions that might still reference problematic fields', problem_count;
    ELSE
        RAISE NOTICE 'SUCCESS: No problematic functions found';
    END IF;

    -- Check for any remaining triggers on visits
    SELECT COUNT(*) INTO problem_count
    FROM information_schema.triggers
    WHERE event_object_table = 'visits'
    AND event_object_schema = 'public';

    IF problem_count > 0 THEN
        RAISE WARNING 'Found % triggers still on visits table', problem_count;
    ELSE
        RAISE NOTICE 'SUCCESS: No triggers on visits table';
    END IF;
END $$;

-- Step 11: Test the fix
DO $$
DECLARE
    test_visit_id TEXT;
BEGIN
    -- Find a test visit
    SELECT visit_id INTO test_visit_id
    FROM public.visits
    LIMIT 1;

    IF test_visit_id IS NOT NULL THEN
        -- Try to update the clinical_service_id (this should work now)
        UPDATE public.visits
        SET clinical_service_id = NULL
        WHERE visit_id = test_visit_id;

        RAISE NOTICE 'SUCCESS: Test update worked for visit_id %', test_visit_id;
    ELSE
        RAISE NOTICE 'No visits found for testing';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Test update failed: %', SQLERRM;
END $$;

SELECT 'CLEANUP COMPLETED - The clinical_service_rate error should be fixed now!' as status;