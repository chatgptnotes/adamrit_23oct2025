-- Verify doctor and diagnosis data for currently admitted patients
-- This checks if junction tables have data linking visits to doctors and diagnoses

-- Part 1: Currently admitted patients with their doctor and diagnosis counts
SELECT
    v.visit_id,
    v.patient_id,
    v.patient_type,
    v.visit_date,
    v.admission_date,
    -- Count of doctors associated with this visit
    (SELECT COUNT(*) FROM visit_hope_surgeons vhs WHERE vhs.visit_id = v.id) as doctor_count,
    -- Count of diagnoses associated with this visit
    (SELECT COUNT(*) FROM visit_diagnoses vd WHERE vd.visit_id = v.id) as diagnosis_count,
    -- Actual doctor names
    (SELECT STRING_AGG(hs.name, ', ')
     FROM visit_hope_surgeons vhs
     JOIN hope_surgeons hs ON vhs.surgeon_id = hs.id
     WHERE vhs.visit_id = v.id) as doctors,
    -- Actual diagnosis names
    (SELECT STRING_AGG(d.name, ', ')
     FROM visit_diagnoses vd
     JOIN diagnoses d ON vd.diagnosis_id = d.id
     WHERE vd.visit_id = v.id) as diagnoses
FROM visits v
WHERE v.patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')
    AND v.discharge_date IS NULL
ORDER BY v.admission_date DESC NULLS LAST;

-- Part 2: Summary statistics
SELECT
    COUNT(*) as total_admitted_patients,
    COUNT(CASE WHEN vhs.visit_id IS NOT NULL THEN 1 END) as patients_with_doctors,
    COUNT(CASE WHEN vd.visit_id IS NOT NULL THEN 1 END) as patients_with_diagnoses,
    COUNT(*) - COUNT(CASE WHEN vhs.visit_id IS NOT NULL THEN 1 END) as patients_missing_doctors,
    COUNT(*) - COUNT(CASE WHEN vd.visit_id IS NOT NULL THEN 1 END) as patients_missing_diagnoses
FROM visits v
LEFT JOIN LATERAL (
    SELECT DISTINCT visit_id FROM visit_hope_surgeons WHERE visit_id = v.id LIMIT 1
) vhs ON true
LEFT JOIN LATERAL (
    SELECT DISTINCT visit_id FROM visit_diagnoses WHERE visit_id = v.id LIMIT 1
) vd ON true
WHERE v.patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')
    AND v.discharge_date IS NULL;

-- Part 3: Check if the tables have any data at all
SELECT 'visit_hope_surgeons' as table_name, COUNT(*) as total_records FROM visit_hope_surgeons
UNION ALL
SELECT 'visit_diagnoses' as table_name, COUNT(*) as total_records FROM visit_diagnoses;
