-- COMPREHENSIVE DIAGNOSTIC QUERY FOR DISCHARGED PATIENTS ISSUE
-- Run this to find out exactly why patients are not showing in Discharged Patients dashboard

-- ====================================================================================
-- 1. CHECK IF WE HAVE ANY PATIENTS WITH DISCHARGE_DATE
-- ====================================================================================
SELECT
    '1. BASIC COUNT' as check_name,
    COUNT(*) as total_with_discharge_date,
    COUNT(CASE WHEN patient_type IN ('IPD', 'Emergency', 'IPD (Inpatient)') THEN 1 END) as ipd_emergency_discharged,
    COUNT(CASE WHEN status = 'discharged' THEN 1 END) as with_status_discharged,
    COUNT(CASE WHEN status != 'discharged' OR status IS NULL THEN 1 END) as with_wrong_status
FROM visits
WHERE discharge_date IS NOT NULL;

-- ====================================================================================
-- 2. SHOW ACTUAL VALUES FOR DISCHARGED PATIENTS
-- ====================================================================================
SELECT
    '2. DISCHARGED PATIENTS DETAILS' as check_name,
    v.visit_id,
    v.patient_type,
    v.status,
    v.discharge_date,
    v.is_discharged,
    v.bill_paid,
    p.hospital_name,
    p.name as patient_name,
    p.patients_id
FROM visits v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE v.discharge_date IS NOT NULL
ORDER BY v.discharge_date DESC
LIMIT 15;

-- ====================================================================================
-- 3. CHECK HOSPITAL_NAME VALUES IN PATIENTS TABLE
-- ====================================================================================
SELECT
    '3. HOSPITAL NAMES' as check_name,
    COALESCE(hospital_name, 'NULL') as hospital_name,
    COUNT(*) as patient_count
FROM patients
GROUP BY hospital_name
ORDER BY patient_count DESC;

-- ====================================================================================
-- 4. CHECK EXACT FILTER MATCH - SIMULATE DISCHARGED PATIENTS PAGE QUERY
-- ====================================================================================
SELECT
    '4. FILTER SIMULATION' as check_name,
    v.visit_id,
    v.patient_type,
    v.status,
    v.discharge_date IS NOT NULL as has_discharge_date,
    v.patient_type IN ('IPD', 'Emergency', 'IPD (Inpatient)') as is_ipd_or_emergency,
    COALESCE(v.status, 'NULL') as status_value,
    (v.status = 'discharged') as status_is_discharged,
    p.hospital_name,
    CASE
        WHEN v.discharge_date IS NOT NULL
         AND v.patient_type IN ('IPD', 'Emergency', 'IPD (Inpatient)')
         AND v.status = 'discharged'
        THEN '✅ SHOULD SHOW'
        WHEN v.discharge_date IS NOT NULL AND v.patient_type NOT IN ('IPD', 'Emergency', 'IPD (Inpatient)')
        THEN '❌ WRONG PATIENT_TYPE'
        WHEN v.discharge_date IS NOT NULL AND (v.status != 'discharged' OR v.status IS NULL)
        THEN '❌ WRONG STATUS'
        ELSE '❌ OTHER ISSUE'
    END as visibility_status
FROM visits v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE v.discharge_date IS NOT NULL
ORDER BY v.discharge_date DESC
LIMIT 20;

-- ====================================================================================
-- 5. CHECK CLIENT-SIDE FILTER (DischargedPatients.tsx line 176)
-- ====================================================================================
SELECT
    '5. CLIENT-SIDE FILTER CHECK' as check_name,
    v.visit_id,
    v.status,
    LOWER(v.status) as status_lowercase,
    (LOWER(v.status) = 'discharged') as passes_client_filter,
    v.patient_type,
    p.hospital_name
FROM visits v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE v.discharge_date IS NOT NULL
  AND v.patient_type IN ('IPD', 'Emergency', 'IPD (Inpatient)')
ORDER BY v.discharge_date DESC
LIMIT 20;

-- ====================================================================================
-- 6. CHECK ALL PATIENT_TYPE VALUES
-- ====================================================================================
SELECT
    '6. PATIENT TYPES' as check_name,
    COALESCE(patient_type, 'NULL') as patient_type,
    COUNT(*) as count,
    COUNT(CASE WHEN discharge_date IS NOT NULL THEN 1 END) as discharged_count
FROM visits
GROUP BY patient_type
ORDER BY count DESC;

-- ====================================================================================
-- 7. CHECK ALL STATUS VALUES
-- ====================================================================================
SELECT
    '7. STATUS VALUES' as check_name,
    COALESCE(status, 'NULL') as status,
    COUNT(*) as count,
    COUNT(CASE WHEN discharge_date IS NOT NULL THEN 1 END) as discharged_count
FROM visits
GROUP BY status
ORDER BY count DESC;

-- ====================================================================================
-- 8. FIND PATIENTS THAT SHOULD SHOW BUT HAVE ISSUES
-- ====================================================================================
SELECT
    '8. PROBLEMATIC RECORDS' as check_name,
    v.visit_id,
    v.patient_type,
    v.status,
    v.discharge_date,
    CASE
        WHEN v.patient_type NOT IN ('IPD', 'Emergency', 'IPD (Inpatient)')
        THEN 'FIX: Change patient_type to IPD or Emergency'
        WHEN v.status IS NULL OR v.status != 'discharged'
        THEN 'FIX: Run migration to set status = discharged'
        ELSE 'Unknown issue'
    END as fix_needed
FROM visits v
WHERE v.discharge_date IS NOT NULL
  AND (
      v.patient_type NOT IN ('IPD', 'Emergency', 'IPD (Inpatient)')
      OR v.status IS NULL
      OR v.status != 'discharged'
  )
ORDER BY v.discharge_date DESC;

-- ====================================================================================
-- 9. FINAL QUERY - EXACTLY WHAT DISCHARGED PATIENTS PAGE SHOULD RETURN
-- ====================================================================================
-- This is the EXACT query that DischargedPatients page runs
SELECT
    '9. FINAL QUERY RESULT' as check_name,
    v.*,
    p.name as patient_name,
    p.patients_id,
    p.hospital_name
FROM visits v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE v.discharge_date IS NOT NULL
  AND v.patient_type IN ('IPD', 'Emergency', 'IPD (Inpatient)')
  -- AND p.hospital_name = 'YOUR_HOSPITAL_NAME_HERE' -- Add hospital filter if needed
ORDER BY v.discharge_date DESC
LIMIT 20;

-- ====================================================================================
-- 10. RECOMMENDATIONS
-- ====================================================================================
-- Run this to get actionable recommendations
SELECT
    '10. RECOMMENDATIONS' as check_name,
    CASE
        WHEN (SELECT COUNT(*) FROM visits WHERE discharge_date IS NOT NULL) = 0
        THEN 'ACTION: No patients have been discharged yet. Discharge a patient first using Final Bill > Invoice button.'

        WHEN (SELECT COUNT(*) FROM visits WHERE discharge_date IS NOT NULL AND patient_type IN ('IPD', 'Emergency', 'IPD (Inpatient)')) = 0
        THEN 'ACTION: Discharged patients exist but they are not IPD/Emergency type. Check patient_type field.'

        WHEN (SELECT COUNT(*) FROM visits WHERE discharge_date IS NOT NULL AND patient_type IN ('IPD', 'Emergency', 'IPD (Inpatient)') AND status = 'discharged') = 0
        THEN 'ACTION: Run migration 20251007000003_set_status_discharged_for_existing.sql to fix status field.'

        ELSE 'SUCCESS: Patients should be showing. Check hospital filter or browser console for errors.'
    END as recommendation;
