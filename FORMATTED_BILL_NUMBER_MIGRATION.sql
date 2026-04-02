-- =====================================================
-- FORMATTED BILL NUMBER MIGRATION
-- Adds formatted_bill_no column and backfills existing bills
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add formatted_bill_no column
ALTER TABLE bills ADD COLUMN IF NOT EXISTS formatted_bill_no TEXT;
CREATE INDEX IF NOT EXISTS idx_bills_formatted_bill_no ON bills(formatted_bill_no);

-- 2. For bills that already have the new format (PANEL-MON-NNN), copy to formatted_bill_no
UPDATE bills
SET formatted_bill_no = bill_no
WHERE bill_no ~ '^[A-Z]+-[A-Z]{3}-\d{3}$'
  AND formatted_bill_no IS NULL;

-- 3. Backfill old-format bills using patient's corporate
-- This function generates formatted_bill_no for all bills that don't have one
CREATE OR REPLACE FUNCTION backfill_formatted_bill_numbers()
RETURNS void AS $$
DECLARE
  bill_rec RECORD;
  corp_name TEXT;
  prefix TEXT;
  month_str TEXT;
  year_str TEXT;
  serial_num INTEGER;
  new_bill_no TEXT;
  month_names TEXT[] := ARRAY['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
BEGIN
  -- Process each bill without formatted_bill_no
  FOR bill_rec IN
    SELECT b.id, b.bill_no, b.date, b.patient_id, b.visit_id,
           COALESCE(p.corporate, v_data.corporate) as corporate
    FROM bills b
    LEFT JOIN patients p ON b.patient_id = p.id
    LEFT JOIN LATERAL (
      SELECT pts.corporate
      FROM visits v
      JOIN patients pts ON v.patient_id = pts.id
      WHERE v.visit_id = b.visit_id
      LIMIT 1
    ) v_data ON true
    WHERE b.formatted_bill_no IS NULL
    ORDER BY b.date, b.created_at
  LOOP
    -- Determine prefix from corporate
    corp_name := COALESCE(bill_rec.corporate, '');
    IF corp_name = '' OR LOWER(corp_name) = 'private' THEN
      prefix := 'PRIVATE';
    ELSIF corp_name ILIKE '%WCL%' OR corp_name ILIKE '%Western Coalfield%' THEN
      prefix := 'WCL';
    ELSIF corp_name ILIKE '%ECHS%' OR corp_name ILIKE '%Ex Serviceman%' THEN
      prefix := 'ECHS';
    ELSIF corp_name ILIKE '%ESIC%' THEN
      prefix := 'ESIC';
    ELSIF corp_name ILIKE '%CGHS%' OR corp_name ILIKE '%Central Government Health%' THEN
      prefix := 'CGHS';
    ELSIF corp_name ILIKE '%PM-JAY%' OR corp_name ILIKE '%Pradhan Mantri%' OR corp_name ILIKE '%PMJAY%' THEN
      prefix := 'PM-JAY';
    ELSIF corp_name ILIKE '%MJPJAY%' OR corp_name ILIKE '%Mahatma Jyotirao%' THEN
      prefix := 'MJPJAY';
    ELSIF corp_name ILIKE '%RBSK%' THEN
      prefix := 'RBSK';
    ELSIF corp_name ILIKE '%MPKAY%' OR corp_name ILIKE '%Maharashtra Police%' THEN
      prefix := 'MPKAY';
    ELSIF corp_name ILIKE '%CIL%' OR corp_name ILIKE '%Coal India%' THEN
      prefix := 'CIL';
    ELSIF corp_name ILIKE '%Railway%' OR corp_name ILIKE '%C.Rly%' THEN
      prefix := 'CR';
    ELSIF corp_name ILIKE '%SECR%' THEN
      prefix := 'SECR';
    ELSE
      prefix := UPPER(REPLACE(SUBSTRING(corp_name FROM 1 FOR 10), ' ', '-'));
    END IF;

    -- Get month from bill date
    month_str := month_names[EXTRACT(MONTH FROM bill_rec.date::date)::integer];
    year_str := EXTRACT(YEAR FROM bill_rec.date::date)::text;

    -- Count existing bills with same prefix and month to get serial
    SELECT COUNT(*) + 1 INTO serial_num
    FROM bills
    WHERE formatted_bill_no LIKE prefix || '-' || month_str || '-%'
      AND formatted_bill_no IS NOT NULL;

    new_bill_no := prefix || '-' || month_str || '-' || LPAD(serial_num::text, 3, '0');

    -- Update the bill
    UPDATE bills SET formatted_bill_no = new_bill_no WHERE id = bill_rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Run the backfill
SELECT backfill_formatted_bill_numbers();

-- 5. Verify
SELECT bill_no, formatted_bill_no, date
FROM bills
ORDER BY date DESC
LIMIT 20;
