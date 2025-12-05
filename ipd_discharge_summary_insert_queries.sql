-- SQL Queries for Storing IPD Discharge Summary Data
-- Based on the comprehensive database structure created earlier

-- 1. Insert Main Discharge Summary
INSERT INTO discharge_summaries (
    visit_id,
    visit_uuid,
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
    other_consultants_text,
    created_at,
    updated_at
) VALUES (
    $1,  -- visit_id (e.g., 'IH25G10001')
    $2,  -- visit_uuid (from visits table)
    $3,  -- patient_name (e.g., 'akon')
    $4,  -- reg_id (e.g., 'UHAY25G10001')
    $5,  -- address (e.g., 'Kamtee Road.')
    $6,  -- age_sex (e.g., '25 Years / male')
    $7,  -- treating_consultant (e.g., 'Dr. Amod Chaurasia')
    $8,  -- doa (Date of Admission - e.g., '2025-06-25')
    $9,  -- other_consultants (e.g., 'Other Consultants')
    $10, -- date_of_discharge (e.g., '2025-09-27')
    $11, -- reason_of_discharge (e.g., 'Please select' or specific reason)
    $12, -- corporate_type (e.g., 'Corporate Type')
    $13, -- diagnosis (e.g., 'Abdominal Injury - Blunt')
    $14, -- investigations (from lab data and other investigations)
    $15, -- stay_notes (from OT Notes section)
    $16, -- treatment_condition (e.g., 'Satisfactory')
    $17, -- treatment_status (e.g., 'Stable')
    $18, -- review_date (e.g., '2025-09-26')
    $19, -- resident_on_discharge (e.g., 'Dr. Smith')
    $20, -- enable_sms_alert (boolean)
    $21, -- other_consultants_text (textarea content)
    NOW(),
    NOW()
);

-- 2. Insert Discharge Medications (Multiple rows for each medication)
INSERT INTO discharge_medications (
    discharge_summary_id,
    medication_name,
    unit,
    remark,
    route,
    dose,
    quantity,
    days,
    start_date,
    timing_morning,
    timing_afternoon,
    timing_evening,
    timing_night,
    is_sos,
    medication_order,
    created_at
) VALUES
-- Example medications from the form
($1, 'Paracetamol 500mg', 'Tab', 'For pain relief', 'PO', 'BD', '10', '5', '2025-09-27', true, false, true, false, false, 0, NOW()),
($1, 'Omeprazole 20mg', 'Cap', 'Before meals', 'PO', 'OD', '7', '7', '2025-09-27', true, false, false, false, false, 1, NOW()),
($1, 'Tramadol 50mg', 'Tab', 'SOS for severe pain', 'PO', 'SOS', '5', '5', '2025-09-27', false, false, false, false, true, 2, NOW());

-- 3. Insert Examination Data
INSERT INTO discharge_examinations (
    discharge_summary_id,
    temperature,
    pulse_rate,
    respiratory_rate,
    blood_pressure,
    spo2,
    examination_details,
    created_at
) VALUES (
    $1,  -- discharge_summary_id
    $2,  -- temperature (e.g., '98.6°F')
    $3,  -- pulse_rate (e.g., '76/min')
    $4,  -- respiratory_rate (e.g., '18/min')
    $5,  -- blood_pressure (e.g., '120/80 mmHg')
    $6,  -- spo2 (e.g., '98%')
    $7,  -- examination_details (detailed examination notes)
    NOW()
);

-- 4. Insert Surgery Details (if applicable)
INSERT INTO discharge_surgery_details (
    discharge_summary_id,
    surgery_date,
    procedure_performed,
    surgeon,
    anesthetist,
    anesthesia_type,
    implant,
    surgery_description,
    created_at
) VALUES (
    $1,  -- discharge_summary_id
    $2,  -- surgery_date (e.g., '2025-09-26 10:30:00')
    $3,  -- procedure_performed (e.g., 'Laminectomy Excision Disc and Tumours')
    $4,  -- surgeon (e.g., 'Dr. Surekha Nandagawli')
    $5,  -- anesthetist (e.g., 'Neha Nakade')
    $6,  -- anesthesia_type (e.g., 'General Anesthesia')
    $7,  -- implant (e.g., 'Titanium mesh')
    $8,  -- surgery_description (detailed surgery notes)
    NOW()
);

-- 5. Complete Transaction Example with Error Handling
DO $$
DECLARE
    v_discharge_summary_id UUID;
    v_visit_uuid UUID;
BEGIN
    -- Get visit UUID
    SELECT id INTO v_visit_uuid
    FROM visits
    WHERE visit_id = 'IH25G10001' -- Replace with actual visit ID
    LIMIT 1;

    -- Insert main discharge summary
    INSERT INTO discharge_summaries (
        visit_id,
        visit_uuid,
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
        enable_sms_alert
    ) VALUES (
        'IH25G10001',
        v_visit_uuid,
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
        true
    ) RETURNING id INTO v_discharge_summary_id;

    -- Insert examination data
    INSERT INTO discharge_examinations (
        discharge_summary_id,
        temperature,
        pulse_rate,
        respiratory_rate,
        blood_pressure,
        spo2,
        examination_details
    ) VALUES (
        v_discharge_summary_id,
        '98.6°F',
        '76/min',
        '18/min',
        '120/80 mmHg',
        '98%',
        'CVS - S1S2 Normal, P/A - Soft, non-tender, CNS - Conscious/Oriented, RS - Clear'
    );

    -- Insert medications
    INSERT INTO discharge_medications (
        discharge_summary_id,
        medication_name,
        unit,
        remark,
        route,
        dose,
        quantity,
        days,
        start_date,
        timing_morning,
        timing_evening,
        is_sos,
        medication_order
    ) VALUES
    (v_discharge_summary_id, 'Paracetamol 500mg', 'Tab', 'For pain relief', 'PO', 'BD', '10', '5', '2025-09-27', true, true, false, 0),
    (v_discharge_summary_id, 'Omeprazole 20mg', 'Cap', 'Before meals', 'PO', 'OD', '7', '7', '2025-09-27', true, false, false, 1);

    -- Insert surgery details (if surgery was performed)
    INSERT INTO discharge_surgery_details (
        discharge_summary_id,
        surgery_date,
        procedure_performed,
        surgeon,
        anesthetist,
        anesthesia_type,
        surgery_description
    ) VALUES (
        v_discharge_summary_id,
        '2025-09-26 10:30:00',
        'Minor procedure',
        'Dr. Surgeon',
        'Dr. Anesthetist',
        'Local Anesthesia',
        'Procedure completed successfully without complications.'
    );

    RAISE NOTICE 'Discharge summary saved successfully with ID: %', v_discharge_summary_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error saving discharge summary: %', SQLERRM;
        ROLLBACK;
END $$;

-- 6. Update Existing Discharge Summary
UPDATE discharge_summaries
SET
    diagnosis = $1,
    investigations = $2,
    stay_notes = $3,
    treatment_condition = $4,
    treatment_status = $5,
    review_date = $6,
    resident_on_discharge = $7,
    enable_sms_alert = $8,
    updated_at = NOW()
WHERE visit_id = $9;

-- 7. Fetch Complete Discharge Summary Data
SELECT
    ds.*,
    -- Medications as JSON array
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', dm.id,
                'name', dm.medication_name,
                'unit', dm.unit,
                'route', dm.route,
                'dose', dm.dose,
                'quantity', dm.quantity,
                'days', dm.days,
                'timing', JSON_BUILD_OBJECT(
                    'morning', dm.timing_morning,
                    'afternoon', dm.timing_afternoon,
                    'evening', dm.timing_evening,
                    'night', dm.timing_night
                ),
                'is_sos', dm.is_sos,
                'remark', dm.remark
            ) ORDER BY dm.medication_order
        ) FILTER (WHERE dm.id IS NOT NULL),
        '[]'::json
    ) as medications,
    -- Examination data
    de.temperature,
    de.pulse_rate,
    de.respiratory_rate,
    de.blood_pressure,
    de.spo2,
    de.examination_details,
    -- Surgery details
    dsd.surgery_date,
    dsd.procedure_performed,
    dsd.surgeon,
    dsd.anesthetist,
    dsd.anesthesia_type,
    dsd.implant,
    dsd.surgery_description
FROM discharge_summaries ds
LEFT JOIN discharge_medications dm ON ds.id = dm.discharge_summary_id
LEFT JOIN discharge_examinations de ON ds.id = de.discharge_summary_id
LEFT JOIN discharge_surgery_details dsd ON ds.id = dsd.discharge_summary_id
WHERE ds.visit_id = 'IH25G10001' -- Replace with actual visit ID
GROUP BY
    ds.id, de.id, dsd.id
ORDER BY ds.created_at DESC;

-- 8. Delete Discharge Summary (with cascade)
DELETE FROM discharge_summaries
WHERE visit_id = 'IH25G10001'; -- This will cascade delete all related records

-- 9. Check if discharge summary exists for a visit
SELECT EXISTS(
    SELECT 1
    FROM discharge_summaries
    WHERE visit_id = 'IH25G10001'
) as discharge_summary_exists;

-- 10. Get discharge summary statistics
SELECT
    COUNT(*) as total_summaries,
    COUNT(DISTINCT visit_id) as unique_visits,
    COUNT(CASE WHEN enable_sms_alert = true THEN 1 END) as sms_alerts_enabled,
    AVG(
        (SELECT COUNT(*) FROM discharge_medications dm WHERE dm.discharge_summary_id = ds.id)
    ) as avg_medications_per_summary
FROM discharge_summaries ds;