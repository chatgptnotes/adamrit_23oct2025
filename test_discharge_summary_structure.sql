-- Test script for discharge summary database structure
-- Run this after applying the migration to verify everything works

-- Test 1: Insert a sample discharge summary
DO $$
DECLARE
  v_summary_id UUID;
  v_visit_uuid UUID;
BEGIN
  -- Get a visit UUID (assuming visit IH25F25001 exists)
  SELECT id INTO v_visit_uuid FROM visits WHERE visit_id = 'IH25F25001' LIMIT 1;

  -- Insert main discharge summary
  INSERT INTO discharge_summaries (
    visit_id,
    visit_uuid,
    diagnosis,
    investigations,
    stay_notes,
    treatment_condition,
    treatment_status,
    review_date,
    resident_on_discharge,
    enable_sms_alert,
    other_consultants,
    reason_of_discharge
  ) VALUES (
    'IH25F25001',
    v_visit_uuid,
    'Abdominal Injury - Blunt (Primary)',
    'KFT, LFT, CBC - All values within normal limits',
    'Patient was comfortable during stay. Regular monitoring done.',
    'Satisfactory',
    'Stable',
    '2025-10-01',
    'Dr. Resident',
    true,
    'Dr. Consultant',
    'Recovered'
  ) RETURNING id INTO v_summary_id;

  RAISE NOTICE 'Created discharge summary with ID: %', v_summary_id;

  -- Insert sample medications
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
  (v_summary_id, 'Paracetamol 500mg', 'Tab', 'For pain relief', 'PO', 'BD', '10', '5', '2025-09-28', true, true, false, 0),
  (v_summary_id, 'Omeprazole 20mg', 'Cap', 'Before meals', 'PO', 'OD', '7', '7', '2025-09-28', true, false, false, 1),
  (v_summary_id, 'Tramadol 50mg', 'Tab', 'SOS for severe pain', 'PO', 'SOS', '5', '5', '2025-09-28', false, false, true, 2);

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
    v_summary_id,
    '98.6°F',
    '76/min',
    '18/min',
    '120/80 mmHg',
    '98%',
    'CVS - S1S2 Normal, P/A - Soft, non-tender, CNS - Conscious/Oriented, RS - Clear'
  );

  -- Insert surgery details
  INSERT INTO discharge_surgery_details (
    discharge_summary_id,
    surgery_date,
    procedure_performed,
    surgeon,
    anesthetist,
    anesthesia_type,
    implant,
    surgery_description
  ) VALUES (
    v_summary_id,
    '2025-09-26 10:30:00',
    'Laminectomy Excision Disc and Tumours (1166)',
    'Dr. Surekha Nandagawli',
    'Neha Nakade',
    'General Anesthesia',
    'Titanium mesh',
    'Successful surgical intervention performed. Patient tolerated procedure well.'
  );

  RAISE NOTICE 'Test data inserted successfully!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during test insert: %', SQLERRM;
    ROLLBACK;
END $$;

-- Test 2: Verify the data was inserted correctly
SELECT 'Main discharge summary' as data_type, COUNT(*) as count
FROM discharge_summaries
WHERE visit_id = 'IH25F25001'

UNION ALL

SELECT 'Medications' as data_type, COUNT(*) as count
FROM discharge_medications dm
JOIN discharge_summaries ds ON dm.discharge_summary_id = ds.id
WHERE ds.visit_id = 'IH25F25001'

UNION ALL

SELECT 'Examinations' as data_type, COUNT(*) as count
FROM discharge_examinations de
JOIN discharge_summaries ds ON de.discharge_summary_id = ds.id
WHERE ds.visit_id = 'IH25F25001'

UNION ALL

SELECT 'Surgery details' as data_type, COUNT(*) as count
FROM discharge_surgery_details dsd
JOIN discharge_summaries ds ON dsd.discharge_summary_id = ds.id
WHERE ds.visit_id = 'IH25F25001';

-- Test 3: Query the complete discharge summary
SELECT
  'Complete discharge summary for ' || ds.visit_id as title,
  ds.diagnosis,
  ds.treatment_condition,
  COUNT(dm.id) as total_medications,
  CASE WHEN de.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_examination,
  CASE WHEN dsd.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_surgery_details
FROM discharge_summaries ds
LEFT JOIN discharge_medications dm ON ds.id = dm.discharge_summary_id
LEFT JOIN discharge_examinations de ON ds.id = de.discharge_summary_id
LEFT JOIN discharge_surgery_details dsd ON ds.id = dsd.discharge_summary_id
WHERE ds.visit_id = 'IH25F25001'
GROUP BY ds.id, ds.visit_id, ds.diagnosis, ds.treatment_condition, de.id, dsd.id;

-- Test 4: Test foreign key constraints (should fail)
DO $$
BEGIN
  -- This should fail due to foreign key constraint
  INSERT INTO discharge_medications (
    discharge_summary_id,
    medication_name
  ) VALUES (
    gen_random_uuid(), -- Non-existent discharge summary ID
    'Test Medication'
  );

  RAISE NOTICE 'ERROR: Foreign key constraint test failed - this should not happen!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Foreign key constraint working correctly: %', SQLERRM;
END $$;

-- Test 5: Test unique constraints
DO $$
DECLARE
  v_visit_uuid UUID;
BEGIN
  -- Get a visit UUID
  SELECT id INTO v_visit_uuid FROM visits WHERE visit_id = 'IH25F25001' LIMIT 1;

  -- This should fail due to unique constraint on visit_id
  INSERT INTO discharge_summaries (
    visit_id,
    visit_uuid,
    diagnosis
  ) VALUES (
    'IH25F25001', -- Same visit_id as above
    v_visit_uuid,
    'Duplicate test'
  );

  RAISE NOTICE 'ERROR: Unique constraint test failed - this should not happen!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Unique constraint working correctly: %', SQLERRM;
END $$;

-- Test 6: Test cascade delete
DO $$
DECLARE
  v_summary_id UUID;
  v_med_count INTEGER;
  v_exam_count INTEGER;
  v_surgery_count INTEGER;
BEGIN
  -- Get the discharge summary ID
  SELECT id INTO v_summary_id FROM discharge_summaries WHERE visit_id = 'IH25F25001';

  -- Count related records before delete
  SELECT COUNT(*) INTO v_med_count FROM discharge_medications WHERE discharge_summary_id = v_summary_id;
  SELECT COUNT(*) INTO v_exam_count FROM discharge_examinations WHERE discharge_summary_id = v_summary_id;
  SELECT COUNT(*) INTO v_surgery_count FROM discharge_surgery_details WHERE discharge_summary_id = v_summary_id;

  RAISE NOTICE 'Before delete: % medications, % examinations, % surgery records', v_med_count, v_exam_count, v_surgery_count;

  -- Delete the main discharge summary (should cascade)
  DELETE FROM discharge_summaries WHERE visit_id = 'IH25F25001';

  -- Count related records after delete
  SELECT COUNT(*) INTO v_med_count FROM discharge_medications WHERE discharge_summary_id = v_summary_id;
  SELECT COUNT(*) INTO v_exam_count FROM discharge_examinations WHERE discharge_summary_id = v_summary_id;
  SELECT COUNT(*) INTO v_surgery_count FROM discharge_surgery_details WHERE discharge_summary_id = v_summary_id;

  RAISE NOTICE 'After delete: % medications, % examinations, % surgery records', v_med_count, v_exam_count, v_surgery_count;

  IF v_med_count = 0 AND v_exam_count = 0 AND v_surgery_count = 0 THEN
    RAISE NOTICE 'SUCCESS: Cascade delete working correctly!';
  ELSE
    RAISE NOTICE 'ERROR: Cascade delete not working properly!';
  END IF;

END $$;

RAISE NOTICE 'All tests completed! Check the output above for results.';