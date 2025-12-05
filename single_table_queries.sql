-- Queries for Single IPD Discharge Summary Table

-- 1. INSERT new discharge summary
INSERT INTO ipd_discharge_summary (
    visit_id,
    patient_name,
    reg_id,
    address,
    age_sex,
    treating_consultant,
    doa,
    other_consultants,
    date_of_discharge,
    reason_of_discharge,
    corporate_type,
    diagnosis,
    investigations,
    stay_notes,
    treatment_condition,
    treatment_status,
    review_date,
    resident_on_discharge,
    enable_sms_alert,
    examination_data,
    medications,
    surgery_details
) VALUES (
    $1,  -- visit_id
    $2,  -- patient_name
    $3,  -- reg_id
    $4,  -- address
    $5,  -- age_sex
    $6,  -- treating_consultant
    $7,  -- doa
    $8,  -- other_consultants
    $9,  -- date_of_discharge
    $10, -- reason_of_discharge
    $11, -- corporate_type
    $12, -- diagnosis
    $13, -- investigations
    $14, -- stay_notes
    $15, -- treatment_condition
    $16, -- treatment_status
    $17, -- review_date
    $18, -- resident_on_discharge
    $19, -- enable_sms_alert
    $20, -- examination_data (JSON)
    $21, -- medications (JSON array)
    $22  -- surgery_details (JSON)
);

-- 2. SELECT complete discharge summary
SELECT
    *,
    -- Extract specific medication data
    (SELECT COUNT(*) FROM jsonb_array_elements(medications)) as medication_count,
    -- Extract examination temperature
    examination_data->>'temperature' as temperature,
    examination_data->>'pulse_rate' as pulse_rate,
    -- Extract surgery date
    surgery_details->>'surgery_date' as surgery_date,
    surgery_details->>'surgeon' as surgeon
FROM ipd_discharge_summary
WHERE visit_id = 'IH25G10001';

-- 3. UPDATE discharge summary
UPDATE ipd_discharge_summary
SET
    diagnosis = $1,
    investigations = $2,
    stay_notes = $3,
    treatment_condition = $4,
    treatment_status = $5,
    review_date = $6,
    resident_on_discharge = $7,
    enable_sms_alert = $8,
    examination_data = $9,
    medications = $10,
    surgery_details = $11,
    updated_at = NOW()
WHERE visit_id = $12;

-- 4. UPDATE only medications
UPDATE ipd_discharge_summary
SET medications = $1
WHERE visit_id = $2;

-- 5. ADD new medication to existing array
UPDATE ipd_discharge_summary
SET medications = medications || $1::jsonb
WHERE visit_id = $2;

-- 6. UPDATE examination data
UPDATE ipd_discharge_summary
SET examination_data = $1
WHERE visit_id = $2;

-- 7. UPDATE surgery details
UPDATE ipd_discharge_summary
SET surgery_details = $1
WHERE visit_id = $2;

-- 8. SELECT with medication details
SELECT
    visit_id,
    patient_name,
    diagnosis,
    jsonb_array_length(medications) as total_medications,
    -- Get all medication names
    (SELECT jsonb_agg(med->>'name')
     FROM jsonb_array_elements(medications) as med) as medication_names,
    -- Get morning medications
    (SELECT jsonb_agg(med->>'name')
     FROM jsonb_array_elements(medications) as med
     WHERE (med->'timing'->>'morning')::boolean = true) as morning_medications
FROM ipd_discharge_summary
WHERE visit_id = 'IH25G10001';

-- 9. SEARCH by medication name
SELECT visit_id, patient_name, diagnosis
FROM ipd_discharge_summary
WHERE medications @> '[{"name": "Paracetamol 500mg"}]';

-- 10. GET patients with specific examination finding
SELECT visit_id, patient_name, examination_data->>'examination_details' as findings
FROM ipd_discharge_summary
WHERE examination_data->>'examination_details' ILIKE '%Normal%';

-- 11. DELETE discharge summary
DELETE FROM ipd_discharge_summary
WHERE visit_id = 'IH25G10001';

-- 12. CHECK if discharge summary exists
SELECT EXISTS(
    SELECT 1 FROM ipd_discharge_summary
    WHERE visit_id = 'IH25G10001'
) as exists;

-- 13. GET statistics
SELECT
    COUNT(*) as total_summaries,
    COUNT(CASE WHEN enable_sms_alert = true THEN 1 END) as sms_enabled,
    AVG(jsonb_array_length(medications)) as avg_medications,
    COUNT(CASE WHEN surgery_details != '{}' THEN 1 END) as with_surgery
FROM ipd_discharge_summary;

-- 14. SAMPLE data insert
INSERT INTO ipd_discharge_summary (
    visit_id,
    patient_name,
    reg_id,
    address,
    age_sex,
    treating_consultant,
    doa,
    other_consultants,
    date_of_discharge,
    reason_of_discharge,
    corporate_type,
    diagnosis,
    investigations,
    stay_notes,
    treatment_condition,
    treatment_status,
    review_date,
    resident_on_discharge,
    enable_sms_alert,
    examination_data,
    medications,
    surgery_details
) VALUES (
    'IH25G10001',
    'akon',
    'UHAY25G10001',
    'Kamtee Road.',
    '25 Years / male',
    'Dr. Amod Chaurasia',
    '2025-06-25',
    'Other Consultants',
    '2025-09-27',
    'Recovered',
    'Corporate Type',
    'Abdominal Injury - Blunt',
    'Lab investigations completed. All values within normal limits.',
    'Patient was comfortable during stay. Regular monitoring done.',
    'Satisfactory',
    'Stable',
    '2025-10-01',
    'Dr. Resident',
    true,
    '{
        "temperature": "98.6°F",
        "pulse_rate": "76/min",
        "respiratory_rate": "18/min",
        "blood_pressure": "120/80 mmHg",
        "spo2": "98%",
        "examination_details": "CVS - S1S2 Normal, P/A - Soft, non-tender, CNS - Conscious/Oriented, RS - Clear"
    }',
    '[
        {
            "name": "Paracetamol 500mg",
            "unit": "Tab",
            "route": "PO",
            "dose": "BD",
            "quantity": "10",
            "days": "5",
            "start_date": "2025-09-27",
            "timing": {
                "morning": true,
                "afternoon": false,
                "evening": true,
                "night": false
            },
            "is_sos": false,
            "remark": "For pain relief"
        },
        {
            "name": "Omeprazole 20mg",
            "unit": "Cap",
            "route": "PO",
            "dose": "OD",
            "quantity": "7",
            "days": "7",
            "start_date": "2025-09-27",
            "timing": {
                "morning": true,
                "afternoon": false,
                "evening": false,
                "night": false
            },
            "is_sos": false,
            "remark": "Before meals"
        }
    ]',
    '{
        "surgery_date": "2025-09-26T10:30:00",
        "procedure_performed": "Minor surgical procedure",
        "surgeon": "Dr. Surgeon Name",
        "anesthetist": "Dr. Anesthetist Name",
        "anesthesia_type": "Local Anesthesia",
        "implant": "",
        "description": "Surgical procedure completed successfully without complications. Patient tolerated procedure well."
    }'
);

-- 15. Extract specific medication data
SELECT
    visit_id,
    patient_name,
    med->>'name' as medication_name,
    med->>'dose' as dose,
    med->>'route' as route,
    (med->'timing'->>'morning')::boolean as morning_dose,
    (med->'timing'->>'evening')::boolean as evening_dose
FROM ipd_discharge_summary,
     jsonb_array_elements(medications) as med
WHERE visit_id = 'IH25G10001';

-- 16. Update specific fields only
UPDATE ipd_discharge_summary
SET
    stay_notes = 'Updated stay notes content',
    examination_data = examination_data || '{"updated_field": "new_value"}'
WHERE visit_id = 'IH25G10001';