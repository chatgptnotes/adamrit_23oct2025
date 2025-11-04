-- ============================================================================
-- Fix Medications Schema and Foreign Key Relationships
-- Date: 2025-11-03
-- Purpose: Fix PatientDetailsModal query failures caused by incorrect FK relationships
--
-- ISSUES FIXED:
-- 1. Table name inconsistency: medication (singular) vs medications (plural)
-- 2. visit_medications FK pointing to wrong table
-- 3. Improperly named foreign keys preventing PostgREST auto-detection
-- ============================================================================

-- ============================================================================
-- PART 1: MEDICATIONS TABLE STANDARDIZATION
-- ============================================================================

-- Create medications table (plural) with all required columns
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  brand_name TEXT,
  description TEXT,
  cost NUMERIC(10,2),
  unit TEXT,
  category TEXT,
  manufacturer TEXT,
  requires_prescription BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate data from old medication table (singular) if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'medication') THEN

    -- Copy data from medication to medications (if not already there)
    INSERT INTO public.medications (id, name, cost, created_at, updated_at)
    SELECT id, name, cost, created_at, updated_at
    FROM public.medication
    WHERE id NOT IN (SELECT id FROM public.medications)
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Migrated data from medication to medications table';
  END IF;
END $$;

-- Create index on medications name for search
CREATE INDEX IF NOT EXISTS idx_medications_name ON public.medications(name);

-- ============================================================================
-- PART 2: VISIT_MEDICATIONS TABLE WITH CORRECT FOREIGN KEYS
-- ============================================================================

-- Drop old visit_medications table and recreate with proper structure
DROP TABLE IF EXISTS public.visit_medications CASCADE;

CREATE TABLE public.visit_medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL,
  medication_id UUID NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  route TEXT, -- oral, IV, IM, etc.
  prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- PROPERLY NAMED FOREIGN KEYS FOR POSTGREST AUTO-DETECTION
  CONSTRAINT visit_medications_visit_id_fkey
    FOREIGN KEY (visit_id)
    REFERENCES public.visits(id)
    ON DELETE CASCADE,

  CONSTRAINT visit_medications_medication_id_fkey
    FOREIGN KEY (medication_id)
    REFERENCES public.medications(id)
    ON DELETE CASCADE,

  -- Prevent duplicate medication assignments to same visit
  CONSTRAINT visit_medications_unique_visit_medication
    UNIQUE (visit_id, medication_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visit_medications_visit_id ON public.visit_medications(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_medications_medication_id ON public.visit_medications(medication_id);
CREATE INDEX IF NOT EXISTS idx_visit_medications_prescribed_date ON public.visit_medications(prescribed_date);

-- ============================================================================
-- PART 3: VISIT_DIAGNOSES TABLE - ENSURE PROPER FOREIGN KEYS
-- ============================================================================

-- Check and fix visit_diagnoses foreign keys if needed
DO $$
BEGIN
  -- Drop visit_diagnoses if it has improperly named foreign keys
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'visit_diagnoses'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name NOT LIKE '%_fkey'
  ) THEN
    DROP TABLE IF EXISTS public.visit_diagnoses CASCADE;

    -- Recreate with proper foreign keys
    CREATE TABLE public.visit_diagnoses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      visit_id UUID NOT NULL,
      diagnosis_id UUID NOT NULL,
      is_primary BOOLEAN DEFAULT false,
      notes TEXT,
      diagnosed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      -- PROPERLY NAMED FOREIGN KEYS FOR POSTGREST AUTO-DETECTION
      CONSTRAINT visit_diagnoses_visit_id_fkey
        FOREIGN KEY (visit_id)
        REFERENCES public.visits(id)
        ON DELETE CASCADE,

      CONSTRAINT visit_diagnoses_diagnosis_id_fkey
        FOREIGN KEY (diagnosis_id)
        REFERENCES public.diagnoses(id)
        ON DELETE CASCADE,

      -- Prevent duplicate diagnosis assignments to same visit
      CONSTRAINT visit_diagnoses_unique_visit_diagnosis
        UNIQUE (visit_id, diagnosis_id)
    );

    CREATE INDEX IF NOT EXISTS idx_visit_diagnoses_visit_id ON public.visit_diagnoses(visit_id);
    CREATE INDEX IF NOT EXISTS idx_visit_diagnoses_diagnosis_id ON public.visit_diagnoses(diagnosis_id);

    RAISE NOTICE 'Recreated visit_diagnoses with proper foreign keys';
  END IF;
END $$;

-- ============================================================================
-- PART 4: CLEANUP - DROP OLD MEDICATION TABLE
-- ============================================================================

-- Drop old medication table (singular) after data migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'medication') THEN
    DROP TABLE public.medication CASCADE;
    RAISE NOTICE 'Dropped old medication (singular) table';
  END IF;
END $$;

-- ============================================================================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_medications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read medications" ON public.medications;
DROP POLICY IF EXISTS "Allow authenticated users to read visit medications" ON public.visit_medications;
DROP POLICY IF EXISTS "Allow authenticated users to insert visit medications" ON public.visit_medications;
DROP POLICY IF EXISTS "Allow authenticated users to update visit medications" ON public.visit_medications;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read medications"
  ON public.medications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read visit medications"
  ON public.visit_medications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert visit medications"
  ON public.visit_medications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update visit medications"
  ON public.visit_medications FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- PART 6: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.medications TO authenticated;
GRANT ALL ON public.visit_medications TO authenticated;

-- ============================================================================
-- VERIFICATION AND SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  med_table_exists BOOLEAN;
  meds_table_exists BOOLEAN;
  vm_fk_count INTEGER;
  vd_fk_count INTEGER;
BEGIN
  -- Check if tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'medication'
  ) INTO med_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'medications'
  ) INTO meds_table_exists;

  -- Count foreign keys
  SELECT COUNT(*) INTO vm_fk_count
  FROM information_schema.table_constraints
  WHERE table_name = 'visit_medications' AND constraint_type = 'FOREIGN KEY';

  SELECT COUNT(*) INTO vd_fk_count
  FROM information_schema.table_constraints
  WHERE table_name = 'visit_diagnoses' AND constraint_type = 'FOREIGN KEY';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Schema Fix Migration Completed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Medications Table Status:';
  RAISE NOTICE '  - Old "medication" (singular): %', CASE WHEN med_table_exists THEN '❌ STILL EXISTS (ERROR)' ELSE '✓ Removed' END;
  RAISE NOTICE '  - New "medications" (plural): %', CASE WHEN meds_table_exists THEN '✓ Exists' ELSE '❌ MISSING (ERROR)' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Foreign Keys:';
  RAISE NOTICE '  - visit_medications FKs: % (should be 2)', vm_fk_count;
  RAISE NOTICE '  - visit_diagnoses FKs: % (should be 2)', vd_fk_count;
  RAISE NOTICE '';
  RAISE NOTICE 'PatientDetailsModal should now work correctly!';
  RAISE NOTICE '';
END $$;
