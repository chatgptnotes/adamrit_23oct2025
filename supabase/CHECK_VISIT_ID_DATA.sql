-- Check if visit_id has actual data in advance_payment for Nov 3
SELECT
  ap.id,
  ap.payment_date,
  ap.advance_amount,
  ap.visit_id,  -- Check if this has actual data or is NULL/empty
  CASE
    WHEN ap.visit_id IS NULL THEN 'visit_id is NULL'
    WHEN ap.visit_id = '' THEN 'visit_id is empty string'
    ELSE 'visit_id has data: ' || ap.visit_id
  END as visit_id_status
FROM advance_payment ap
WHERE DATE(ap.payment_date) = '2025-11-03'
  AND ap.payment_mode = 'ONLINE'
ORDER BY ap.payment_date;
