-- ============================================================================
-- Diagnostic Query: Database Schema Relationships
-- Date: 2025-11-03
-- Purpose: Verify foreign key relationships for PatientDetailsModal
-- ============================================================================

-- STEP 1: Check which medication table exists
SELECT
  '========== MEDICATION TABLES ==========' as info,
  '' as details
UNION ALL
SELECT
  'Checking which medication table(s) exist:' as info,
  '' as details;

SELECT
  'TABLE EXISTS' as check_type,
  table_name,
  CASE
    WHEN table_name = 'medication' THEN '⚠️ SINGULAR (OLD/WRONG)'
    WHEN table_name = 'medications' THEN '✓ PLURAL (CORRECT)'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('medication', 'medications')
ORDER BY table_name;

-- STEP 2: Check foreign keys on visit_medications
SELECT
  '========== VISIT_MEDICATIONS FOREIGN KEYS ==========' as info,
  '' as details
UNION ALL
SELECT
  'Foreign keys on visit_medications table:' as info,
  '' as details;

SELECT
  'FOREIGN KEY' as check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE
    WHEN ccu.table_name = 'medication' THEN '❌ WRONG - Points to medication (singular)'
    WHEN ccu.table_name = 'medications' THEN '✓ CORRECT - Points to medications (plural)'
    WHEN ccu.table_name = 'visits' THEN '✓ CORRECT'
    ELSE '⚠️ UNEXPECTED'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'visit_medications'
ORDER BY kcu.column_name;

-- STEP 3: Check foreign keys on visit_diagnoses
SELECT
  '========== VISIT_DIAGNOSES FOREIGN KEYS ==========' as info,
  '' as details
UNION ALL
SELECT
  'Foreign keys on visit_diagnoses table:' as info,
  '' as details;

SELECT
  'FOREIGN KEY' as check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE
    WHEN ccu.table_name = 'visits' AND tc.constraint_name LIKE '%visit_id%' THEN '✓ CORRECT'
    WHEN ccu.table_name = 'diagnoses' AND tc.constraint_name LIKE '%diagnosis_id%' THEN '✓ CORRECT'
    ELSE '⚠️ CHECK NAMING'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'visit_diagnoses'
ORDER BY kcu.column_name;

-- STEP 4: Check if medications table has required columns
SELECT
  '========== MEDICATIONS TABLE STRUCTURE ==========' as info,
  '' as details
UNION ALL
SELECT
  'Checking if medications table has id, name, cost columns:' as info,
  '' as details;

SELECT
  'COLUMN' as check_type,
  column_name,
  data_type,
  CASE
    WHEN column_name = 'id' AND data_type = 'uuid' THEN '✓ CORRECT'
    WHEN column_name = 'name' AND data_type IN ('text', 'character varying') THEN '✓ CORRECT'
    WHEN column_name = 'cost' AND data_type = 'numeric' THEN '✓ CORRECT'
    ELSE '⚠️ CHECK TYPE'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'medications'
AND column_name IN ('id', 'name', 'cost')
ORDER BY
  CASE column_name
    WHEN 'id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'cost' THEN 3
  END;

-- STEP 5: Check visit_medications table structure
SELECT
  '========== VISIT_MEDICATIONS TABLE STRUCTURE ==========' as info,
  '' as details
UNION ALL
SELECT
  'Checking visit_medications column types:' as info,
  '' as details;

SELECT
  'COLUMN' as check_type,
  column_name,
  data_type,
  CASE
    WHEN column_name = 'visit_id' AND data_type = 'uuid' THEN '✓ CORRECT'
    WHEN column_name = 'visit_id' AND data_type = 'text' THEN '❌ WRONG - Should be UUID'
    WHEN column_name = 'medication_id' AND data_type = 'uuid' THEN '✓ CORRECT'
    ELSE '✓ OK'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'visit_medications'
AND column_name IN ('id', 'visit_id', 'medication_id', 'dosage', 'frequency', 'duration', 'prescribed_date')
ORDER BY ordinal_position;

-- STEP 6: Summary and Recommendations
SELECT
  '========== SUMMARY ==========' as info,
  '' as details
UNION ALL
SELECT
  'Issues Found:' as info,
  '' as details
UNION ALL
SELECT
  '1. Medication table name:' as info,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'medication')
    THEN '❌ OLD "medication" table exists'
    ELSE '✓ Only "medications" exists'
  END as details
UNION ALL
SELECT
  '2. Visit_medications FK:' as info,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'visit_medications' AND ccu.table_name = 'medication'
    )
    THEN '❌ Points to wrong table (medication singular)'
    ELSE '✓ Correct or needs verification'
  END as details;
