-- IPD Discharge Summary Data Store Query
-- Complete query to insert all form data into single table

-- 1. UPSERT Query (Insert or Update if exists)
INSERT INTO ipd_discharge_summary (
    -- Visit Information
    visit_id,
    visit_uuid,

    -- Patient Information
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
    other_consultants_text,

    -- Medical Information
    diagnosis,
    investigations,
    stay_notes,

    -- Treatment Information
    treatment_condition,
    treatment_status,
    review_date,
    resident_on_discharge,
    enable_sms_alert,

    -- Complex Data as JSON
    examination_data,
    medications,
    surgery_details,

    -- Metadata
    created_at,
    updated_at
) VALUES (
    -- Visit Information
    $1,    -- visit_id (e.g., 'IH25G10001')
    $2,    -- visit_uuid (from visits table)

    -- Patient Information
    $3,    -- patient_name (e.g., 'akon')
    $4,    -- reg_id (e.g., 'UHAY25G10001')
    $5,    -- address (e.g., 'Kamtee Road.')
    $6,    -- age_sex (e.g., '25 Years / male')
    $7,    -- treating_consultant (e.g., 'Dr. Amod Chaurasia')
    $8,    -- doa (e.g., '2025-06-25')
    $9,    -- other_consultants (e.g., 'Other Consultants')
    $10,   -- date_of_discharge (e.g., '2025-09-27')
    $11,   -- reason_of_discharge (e.g., 'Recovered')
    $12,   -- corporate_type (e.g., 'Corporate Type')
    $13,   -- other_consultants_text (textarea content)

    -- Medical Information
    $14,   -- diagnosis (e.g., 'Abdominal Injury - Blunt')
    $15,   -- investigations (lab results text)
    $16,   -- stay_notes (OT Notes content)

    -- Treatment Information
    $17,   -- treatment_condition (e.g., 'Satisfactory')
    $18,   -- treatment_status (e.g., 'Stable')
    $19,   -- review_date (e.g., '2025-10-01')
    $20,   -- resident_on_discharge (e.g., 'Dr. Resident')
    $21,   -- enable_sms_alert (boolean)

    -- Complex Data as JSON
    $22,   -- examination_data (JSON object)
    $23,   -- medications (JSON array)
    $24,   -- surgery_details (JSON object)

    -- Metadata
    NOW(),
    NOW()
)
ON CONFLICT (visit_id)
DO UPDATE SET
    -- Patient Information
    patient_name = EXCLUDED.patient_name,
    reg_id = EXCLUDED.reg_id,
    address = EXCLUDED.address,
    age_sex = EXCLUDED.age_sex,
    treating_consultant = EXCLUDED.treating_consultant,
    doa = EXCLUDED.doa,
    other_consultants = EXCLUDED.other_consultants,
    date_of_discharge = EXCLUDED.date_of_discharge,
    reason_of_discharge = EXCLUDED.reason_of_discharge,
    corporate_type = EXCLUDED.corporate_type,
    other_consultants_text = EXCLUDED.other_consultants_text,

    -- Medical Information
    diagnosis = EXCLUDED.diagnosis,
    investigations = EXCLUDED.investigations,
    stay_notes = EXCLUDED.stay_notes,

    -- Treatment Information
    treatment_condition = EXCLUDED.treatment_condition,
    treatment_status = EXCLUDED.treatment_status,
    review_date = EXCLUDED.review_date,
    resident_on_discharge = EXCLUDED.resident_on_discharge,
    enable_sms_alert = EXCLUDED.enable_sms_alert,

    -- Complex Data
    examination_data = EXCLUDED.examination_data,
    medications = EXCLUDED.medications,
    surgery_details = EXCLUDED.surgery_details,

    -- Metadata
    updated_at = NOW()
RETURNING id, visit_id;

-- 2. Sample Complete Data Insert
-- Example with actual data from the form
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
    other_consultants_text,
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
    'Additional consultant details here...',
    'Abdominal Injury - Blunt',
    'Lab investigations completed. KFT, LFT, CBC - All values within normal limits. X-ray chest normal.',
    'Patient was comfortable during stay. Regular monitoring done. Vital signs stable throughout.',
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
        "examination_details": "CVS - S1S2 Normal, No murmur. P/A - Soft, non-tender, no organomegaly. CNS - Conscious, Oriented to time, place, person. RS - Clear, equal air entry bilateral."
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
            "remark": "For pain relief",
            "order": 1
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
            "remark": "Before meals",
            "order": 2
        },
        {
            "name": "Tramadol 50mg",
            "unit": "Tab",
            "route": "PO",
            "dose": "SOS",
            "quantity": "5",
            "days": "5",
            "start_date": "2025-09-27",
            "timing": {
                "morning": false,
                "afternoon": false,
                "evening": false,
                "night": false
            },
            "is_sos": true,
            "remark": "SOS for severe pain",
            "order": 3
        }
    ]',
    '{
        "surgery_date": "2025-09-26T10:30:00",
        "procedure_performed": "Laminectomy Excision Disc and Tumours (1166)",
        "surgeon": "Dr. Surekha Nandagawli",
        "anesthetist": "Neha Nakade",
        "anesthesia_type": "General Anesthesia",
        "implant": "Titanium mesh",
        "description": "Surgical procedure completed successfully without complications. Patient tolerated procedure well. Post-operative recovery uneventful.",
        "duration": "2 hours",
        "blood_loss": "Minimal",
        "complications": "None"
    }'
)
ON CONFLICT (visit_id)
DO UPDATE SET
    patient_name = EXCLUDED.patient_name,
    diagnosis = EXCLUDED.diagnosis,
    investigations = EXCLUDED.investigations,
    stay_notes = EXCLUDED.stay_notes,
    treatment_condition = EXCLUDED.treatment_condition,
    treatment_status = EXCLUDED.treatment_status,
    medications = EXCLUDED.medications,
    examination_data = EXCLUDED.examination_data,
    surgery_details = EXCLUDED.surgery_details,
    updated_at = NOW()
RETURNING id, visit_id;

-- 3. JavaScript/TypeScript format for frontend
/*
const dischargeSummaryData = {
    visit_id: 'IH25G10001',
    patient_name: 'akon',
    reg_id: 'UHAY25G10001',
    address: 'Kamtee Road.',
    age_sex: '25 Years / male',
    treating_consultant: 'Dr. Amod Chaurasia',
    doa: '2025-06-25',
    other_consultants: 'Other Consultants',
    date_of_discharge: '2025-09-27',
    reason_of_discharge: 'Recovered',
    corporate_type: 'Corporate Type',
    other_consultants_text: 'Additional consultant details...',
    diagnosis: 'Abdominal Injury - Blunt',
    investigations: 'Lab investigations completed...',
    stay_notes: 'Patient was comfortable during stay...',
    treatment_condition: 'Satisfactory',
    treatment_status: 'Stable',
    review_date: '2025-10-01',
    resident_on_discharge: 'Dr. Resident',
    enable_sms_alert: true,
    examination_data: {
        temperature: '98.6°F',
        pulse_rate: '76/min',
        respiratory_rate: '18/min',
        blood_pressure: '120/80 mmHg',
        spo2: '98%',
        examination_details: 'CVS - S1S2 Normal...'
    },
    medications: [
        {
            name: 'Paracetamol 500mg',
            unit: 'Tab',
            route: 'PO',
            dose: 'BD',
            quantity: '10',
            days: '5',
            timing: { morning: true, evening: true },
            is_sos: false,
            remark: 'For pain relief'
        }
    ],
    surgery_details: {
        surgery_date: '2025-09-26T10:30:00',
        procedure_performed: 'Laminectomy...',
        surgeon: 'Dr. Surekha Nandagawli',
        anesthetist: 'Neha Nakade'
    }
};
*/

-- 4. Query to fetch complete discharge summary
SELECT
    id,
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
    other_consultants_text,
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
    surgery_details,
    created_at,
    updated_at,
    -- Extract medication count
    jsonb_array_length(medications) as medication_count,
    -- Extract examination temperature
    examination_data->>'temperature' as temperature,
    -- Extract surgery surgeon
    surgery_details->>'surgeon' as surgeon_name
FROM ipd_discharge_summary
WHERE visit_id = 'IH25G10001';

-- 5. Check if discharge summary exists before insert
DO $$
DECLARE
    v_exists BOOLEAN;
    v_discharge_id UUID;
BEGIN
    -- Check if record exists
    SELECT EXISTS(
        SELECT 1 FROM ipd_discharge_summary
        WHERE visit_id = 'IH25G10001'
    ) INTO v_exists;

    IF v_exists THEN
        RAISE NOTICE 'Discharge summary exists. Updating...';
        -- Update existing record
        UPDATE ipd_discharge_summary
        SET
            stay_notes = 'Updated stay notes...',
            updated_at = NOW()
        WHERE visit_id = 'IH25G10001'
        RETURNING id INTO v_discharge_id;

        RAISE NOTICE 'Updated discharge summary ID: %', v_discharge_id;
    ELSE
        RAISE NOTICE 'Creating new discharge summary...';
        -- Insert new record
        INSERT INTO ipd_discharge_summary (visit_id, patient_name, diagnosis)
        VALUES ('IH25G10001', 'akon', 'Abdominal Injury - Blunt')
        RETURNING id INTO v_discharge_id;

        RAISE NOTICE 'Created discharge summary ID: %', v_discharge_id;
    END IF;
END $$;

-- 6. Validation query before insert
SELECT
    CASE
        WHEN visit_id IS NULL OR visit_id = '' THEN 'Visit ID is required'
        WHEN patient_name IS NULL OR patient_name = '' THEN 'Patient name is required'
        WHEN diagnosis IS NULL OR diagnosis = '' THEN 'Diagnosis is required'
        ELSE 'Valid'
    END as validation_result
FROM (
    SELECT
        'IH25G10001' as visit_id,
        'akon' as patient_name,
        'Abdominal Injury - Blunt' as diagnosis
) as input_data;