-- Add nested sub-tests support to existing lab_results table
-- This query modifies the existing schema to support hierarchical nested sub-tests

-- Step 1: Add new columns to lab_results table
ALTER TABLE public.lab_results
ADD COLUMN IF NOT EXISTS parent_test_id uuid NULL,
ADD COLUMN IF NOT EXISTS test_level integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sub_test_config jsonb NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS display_order integer NULL DEFAULT 0;

-- Step 2: Add foreign key constraint for parent_test_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'lab_results_parent_test_id_fkey'
    ) THEN
        ALTER TABLE public.lab_results
        ADD CONSTRAINT lab_results_parent_test_id_fkey
        FOREIGN KEY (parent_test_id)
        REFERENCES public.lab_results(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lab_results_parent_test_id
ON public.lab_results USING btree (parent_test_id)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lab_results_test_level
ON public.lab_results USING btree (test_level)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lab_results_display_order
ON public.lab_results USING btree (display_order)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lab_results_sub_test_config
ON public.lab_results USING gin (sub_test_config)
TABLESPACE pg_default;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.lab_results.parent_test_id IS 'References parent test ID for nested sub-tests. NULL for main tests and level-1 sub-tests.';
COMMENT ON COLUMN public.lab_results.test_level IS 'Hierarchy level: 0=Main test, 1=Sub-test, 2=Nested sub-test, 3=Further nested';
COMMENT ON COLUMN public.lab_results.sub_test_config IS 'JSONB containing age ranges, normal ranges: {"unit":"g/dL","ageRanges":[...],"normalRanges":[...]}';
COMMENT ON COLUMN public.lab_results.display_order IS 'Display order of sub-tests under parent test';

-- Step 5: Updated table structure (for reference)
-- The final lab_results table structure will be:
--
-- CREATE TABLE public.lab_results (
--   id uuid NOT NULL DEFAULT gen_random_uuid(),
--   main_test_name character varying(255) NULL,
--   test_name character varying(255) NOT NULL,
--   test_category character varying(100) NULL DEFAULT 'GENERAL'::character varying,
--   result_value text NULL,
--   result_unit character varying(50) NULL,
--   reference_range character varying(100) NULL,
--   comments text NULL,
--   is_abnormal boolean NULL DEFAULT false,
--   result_status character varying(20) NULL DEFAULT 'Preliminary'::character varying,
--   technician_name character varying(100) NULL,
--   pathologist_name character varying(100) NULL,
--   authenticated_result boolean NULL DEFAULT false,
--   patient_name character varying(255) NULL,
--   patient_age integer NULL,
--   patient_gender character varying(20) NULL,
--   visit_id uuid NULL,
--   lab_id uuid NULL,
--   created_at timestamp with time zone NULL DEFAULT now(),
--   updated_at timestamp with time zone NULL DEFAULT now(),
--
--   -- NEW COLUMNS FOR NESTED SUB-TESTS
--   parent_test_id uuid NULL,                    -- Points to parent test
--   test_level integer NOT NULL DEFAULT 0,       -- 0=Main, 1=Sub, 2=Nested
--   sub_test_config jsonb NULL DEFAULT '{}'::jsonb,  -- Config data
--   display_order integer NULL DEFAULT 0,        -- Sort order
--
--   CONSTRAINT lab_results_pkey PRIMARY KEY (id),
--   CONSTRAINT lab_results_parent_test_id_fkey FOREIGN KEY (parent_test_id) REFERENCES public.lab_results(id) ON DELETE CASCADE,
--   CONSTRAINT lab_results_result_status_check CHECK (
--     (result_status)::text = ANY (ARRAY['Preliminary'::character varying, 'Final'::character varying]::text[])
--   )
-- ) TABLESPACE pg_default;

-- Step 6: Verify the changes
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'lab_results'
AND column_name IN ('parent_test_id', 'test_level', 'sub_test_config', 'display_order')
ORDER BY ordinal_position;

-- Expected output:
-- column_name      | data_type | column_default | is_nullable
-- -----------------|-----------|----------------|------------
-- parent_test_id   | uuid      | NULL           | YES
-- test_level       | integer   | 0              | NO
-- sub_test_config  | jsonb     | '{}'::jsonb    | YES
-- display_order    | integer   | 0              | YES
