-- Insert sample OT notes data for testing
-- This will help test the discharge summary OT section display

-- First, get some visit and patient IDs to link the OT notes
DO $$
DECLARE
  v_visit_id UUID;
  v_patient_id UUID;
  v_patient_name VARCHAR(500);
BEGIN
  -- Get the first visit record to use for testing
  SELECT v.id, v.patient_id, p.name
  INTO v_visit_id, v_patient_id, v_patient_name
  FROM visits v
  LEFT JOIN patients p ON v.patient_id = p.id
  LIMIT 1;

  -- Only insert if we found a visit
  IF v_visit_id IS NOT NULL THEN
    -- Insert sample OT note
    INSERT INTO ot_notes (
      visit_id,
      patient_id,
      patient_name,
      surgery_name,
      surgery_code,
      surgery_rate,
      surgery_status,
      date,
      procedure_performed,
      surgeon,
      anaesthetist,
      anaesthesia,
      implant,
      description,
      ai_generated
    ) VALUES (
      v_visit_id,
      v_patient_id,
      COALESCE(v_patient_name, 'Test Patient'),
      'Laparoscopic Cholecystectomy',
      'S45',
      25000.00,
      'Sanctioned',
      NOW() - INTERVAL '2 days',
      'Laparoscopic removal of gallbladder',
      'Dr. Vijay Sarwad',
      'Dr. Pranit Gumule',
      'General Anesthesia',
      'Titanium clips x 3',
      'Patient underwent successful laparoscopic cholecystectomy. Four port technique used. Calot''s triangle dissected. Critical view of safety achieved. Cystic artery clipped and divided. Cystic duct clipped and divided. Gallbladder dissected from liver bed. Hemostasis achieved. Specimen retrieved in endobag. Ports closed in layers.',
      false
    ) ON CONFLICT (visit_id) DO UPDATE
    SET
      surgery_name = EXCLUDED.surgery_name,
      surgeon = EXCLUDED.surgeon,
      anaesthetist = EXCLUDED.anaesthetist,
      anaesthesia = EXCLUDED.anaesthesia,
      implant = EXCLUDED.implant,
      updated_at = NOW();

    RAISE NOTICE 'Sample OT note inserted/updated for visit_id: %', v_visit_id;
  ELSE
    RAISE NOTICE 'No visits found to link OT notes to';
  END IF;
END $$;

-- Also insert a standalone sample for the test patients if they exist
INSERT INTO ot_notes (
  visit_id,
  patient_id,
  patient_name,
  surgery_name,
  surgery_code,
  surgery_rate,
  surgery_status,
  date,
  procedure_performed,
  surgeon,
  anaesthetist,
  anaesthesia,
  implant,
  description
)
SELECT
  v.id,
  v.patient_id,
  p.name,
  'Appendectomy',
  'S12',
  15000.00,
  'Sanctioned',
  NOW() - INTERVAL '1 day',
  'Laparoscopic appendectomy',
  'Dr. Ritesh Nawkhare',
  'Dr. Ashok Kumar',
  'Spinal Anesthesia',
  'Endoloop x 1',
  'Emergency laparoscopic appendectomy performed. Three port technique. Appendix identified - inflamed and edematous. Mesoappendix divided. Base of appendix secured with endoloop and divided. Specimen removed. Peritoneal lavage done. Hemostasis confirmed.'
FROM visits v
JOIN patients p ON v.patient_id = p.id
WHERE p.name LIKE 'test%'
LIMIT 1
ON CONFLICT (visit_id) DO NOTHING;

-- Show what's in the ot_notes table after insertion
DO $$
DECLARE
  ot_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ot_count FROM ot_notes;
  RAISE NOTICE 'Total OT notes in database: %', ot_count;
END $$;