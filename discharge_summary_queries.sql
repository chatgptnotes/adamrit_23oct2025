-- Useful queries for IPD Discharge Summary data management

-- 1. Get complete discharge summary with all related data
SELECT
  ds.id as summary_id,
  ds.visit_id,
  ds.diagnosis,
  ds.investigations,
  ds.treatment_condition,
  ds.treatment_status,
  ds.created_at,
  ds.updated_at,

  -- Count of related records
  COUNT(DISTINCT dm.id) as medication_count,
  CASE WHEN de.id IS NOT NULL THEN 1 ELSE 0 END as has_examination,
  CASE WHEN dsd.id IS NOT NULL THEN 1 ELSE 0 END as has_surgery_details

FROM discharge_summaries ds
LEFT JOIN discharge_medications dm ON ds.id = dm.discharge_summary_id
LEFT JOIN discharge_examinations de ON ds.id = de.discharge_summary_id
LEFT JOIN discharge_surgery_details dsd ON ds.id = dsd.discharge_summary_id
WHERE ds.visit_id = 'IH25F25001' -- Replace with actual visit ID
GROUP BY ds.id, de.id, dsd.id;

-- 2. Get all medications for a specific discharge summary
SELECT
  dm.*,
  ds.visit_id
FROM discharge_medications dm
JOIN discharge_summaries ds ON dm.discharge_summary_id = ds.id
WHERE ds.visit_id = 'IH25F25001' -- Replace with actual visit ID
ORDER BY dm.medication_order;

-- 3. Get examination data for a discharge summary
SELECT
  de.*,
  ds.visit_id,
  ds.diagnosis
FROM discharge_examinations de
JOIN discharge_summaries ds ON de.discharge_summary_id = ds.id
WHERE ds.visit_id = 'IH25F25001'; -- Replace with actual visit ID

-- 4. Get surgery details for a discharge summary
SELECT
  dsd.*,
  ds.visit_id,
  ds.diagnosis
FROM discharge_surgery_details dsd
JOIN discharge_summaries ds ON dsd.discharge_summary_id = ds.id
WHERE ds.visit_id = 'IH25F25001'; -- Replace with actual visit ID

-- 5. Complete discharge summary report query
SELECT
  ds.visit_id,
  ds.diagnosis,
  ds.investigations,
  ds.stay_notes,
  ds.treatment_condition,
  ds.treatment_status,
  ds.review_date,
  ds.resident_on_discharge,
  ds.enable_sms_alert,
  ds.created_at,

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
  dsd.surgery_description,

  -- Medications (as JSON array)
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
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
        'is_sos', dm.is_sos
      ) ORDER BY dm.medication_order
    ) FILTER (WHERE dm.id IS NOT NULL),
    '[]'::json
  ) as medications

FROM discharge_summaries ds
LEFT JOIN discharge_examinations de ON ds.id = de.discharge_summary_id
LEFT JOIN discharge_surgery_details dsd ON ds.id = dsd.discharge_summary_id
LEFT JOIN discharge_medications dm ON ds.id = dm.discharge_summary_id
WHERE ds.visit_id = 'IH25F25001' -- Replace with actual visit ID
GROUP BY
  ds.id, ds.visit_id, ds.diagnosis, ds.investigations, ds.stay_notes,
  ds.treatment_condition, ds.treatment_status, ds.review_date,
  ds.resident_on_discharge, ds.enable_sms_alert, ds.created_at,
  de.temperature, de.pulse_rate, de.respiratory_rate, de.blood_pressure,
  de.spo2, de.examination_details,
  dsd.surgery_date, dsd.procedure_performed, dsd.surgeon, dsd.anesthetist,
  dsd.anesthesia_type, dsd.implant, dsd.surgery_description;

-- 6. List all discharge summaries with basic info
SELECT
  ds.visit_id,
  ds.diagnosis,
  ds.treatment_condition,
  ds.created_at,
  ds.updated_at,
  COUNT(dm.id) as medication_count,
  CASE WHEN de.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_examination,
  CASE WHEN dsd.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_surgery
FROM discharge_summaries ds
LEFT JOIN discharge_medications dm ON ds.id = dm.discharge_summary_id
LEFT JOIN discharge_examinations de ON ds.id = de.discharge_summary_id
LEFT JOIN discharge_surgery_details dsd ON ds.id = dsd.discharge_summary_id
GROUP BY ds.id, de.id, dsd.id
ORDER BY ds.created_at DESC;

-- 7. Delete discharge summary and all related data (cascade should handle this)
-- DELETE FROM discharge_summaries WHERE visit_id = 'IH25F25001';

-- 8. Update medication timing for a specific medication
-- UPDATE discharge_medications
-- SET timing_morning = true, timing_evening = true
-- WHERE medication_name = 'Paracetamol'
-- AND discharge_summary_id = (
--   SELECT id FROM discharge_summaries WHERE visit_id = 'IH25F25001'
-- );

-- 9. Get statistics about discharge summaries
SELECT
  COUNT(*) as total_discharge_summaries,
  COUNT(DISTINCT ds.visit_id) as unique_visits,
  AVG(medication_counts.med_count) as avg_medications_per_discharge,
  COUNT(CASE WHEN de.id IS NOT NULL THEN 1 END) as summaries_with_examination,
  COUNT(CASE WHEN dsd.id IS NOT NULL THEN 1 END) as summaries_with_surgery
FROM discharge_summaries ds
LEFT JOIN discharge_examinations de ON ds.id = de.discharge_summary_id
LEFT JOIN discharge_surgery_details dsd ON ds.id = dsd.discharge_summary_id
LEFT JOIN (
  SELECT discharge_summary_id, COUNT(*) as med_count
  FROM discharge_medications
  GROUP BY discharge_summary_id
) medication_counts ON ds.id = medication_counts.discharge_summary_id;

-- 10. Search discharge summaries by diagnosis
SELECT
  ds.visit_id,
  ds.diagnosis,
  ds.treatment_condition,
  ds.created_at,
  COUNT(dm.id) as medication_count
FROM discharge_summaries ds
LEFT JOIN discharge_medications dm ON ds.id = dm.discharge_summary_id
WHERE ds.diagnosis ILIKE '%Abdominal%' -- Search term
GROUP BY ds.id
ORDER BY ds.created_at DESC;