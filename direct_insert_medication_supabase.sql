-- =====================================================
-- DIRECT INSERT INTO MEDICATION TABLE (Supabase)
-- No pharmacy_items table needed!
-- =====================================================

-- Sample data from pharmacy_items.sql - Insert directly into medication
-- Add more rows as needed from your pharmacy_items.sql file

INSERT INTO public.medication (
  name,
  generic_name,
  item_code,
  drug_id_external,
  stock,
  loose_stock,
  pack,
  pack_size,
  manufacturer,
  manufacturer_id,
  supplier_name,
  supplier_id,
  shelf,
  dosage_form,
  strength,
  is_deleted,
  is_implant,
  item_type,
  created_at,
  updated_at
) VALUES
  -- Row 1
  ('1-AL TAB', 'LEVOCETRIZINE', 'T1AL001', '1', '0', 0, '10', 10, 'FDC LIMITED', '1', NULL, NULL, '', 'Pack', NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 2
  ('3D FLAM INJ', 'DICLOFENAC SODIUM', 'I3DF001', '2', '0', NULL, '3', 3, 'INTAS PHARMACEUTICALS LTD.', '2', NULL, NULL, '', NULL, NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 3
  ('7-LA SYP', NULL, 'S7LA001', '3', '0', 0, '1', 1, 'FDC LIMITED', '1', 'BOMBAY MEDICOS', '255', '', NULL, NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 4
  ('A TO Z TAB', NULL, 'TA-Z000', '5', '0', 0, '15', 15, 'ALKEM LAB', '4', NULL, '255', '', NULL, NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 5
  ('A-TO-Z SYP 200ML', NULL, 'SAZS001', '6', '0', 0, '1', 1, 'ALKEM LAB', '4', NULL, '261', '', 'Syrup', NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 6
  ('AALCETAMOL-100ML INJ', 'PARACETAMOL', 'IAAL001', '7', '0', NULL, '1', 1, 'ALCON LABORATORIES INDIA PVT L', '5', NULL, '414', '', NULL, NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 7
  ('AB-CEF O 200 TAB', 'CEFIXIME & OFLOXACIN', 'TTAB033', '8', '0', 0, '10', 10, 'SHIELD HEALTHCARE PVT.LTD', '3', NULL, '285', '', NULL, NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 8
  ('ABD-GAUZE-SWAB-25*40(5X1)PAC', 'SURGICAL PRODOUCT', 'UABD010', '9', '7', 0, '1', 1, 'RAMKRUSHNA VIDYUT AURVEDIC', '6', NULL, '260', '', 'Disposables', NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 9
  ('ABDOMINAL BELT 40[X-LAG]', NULL, 'UABDO00', '10', '1', 0, '1', 1, 'ORTHOPAEDIC APPLIANCE COM.', '7', NULL, '388', '', NULL, NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 10
  ('ABDOMINAL BELT(L)', 'SURGICAL PRODUCT', 'UABD018', '11', '0', 0, '1', 1, 'FLEMINGO LTD', '8', NULL, '271', '', 'Disposables', NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 11
  ('ABDOMINAL BELT(M)', 'SURGICAL PRODUCT', 'UABD013', '12', '4', 0, '1', 1, 'BHARAT MEDICAL SYSTEMS', '9', NULL, '258', '', 'Disposables', NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 12
  ('ABDOMINAL BELT(S)', 'SURGICAL PRODUCT', 'UABD017', '13', '0', 0, '1', 1, 'MEDICARE LIMITED', '10', NULL, '268', '', 'Disposables', NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 13
  ('ABDOMINAL BINDER', NULL, 'UABD014', '14', '0', 0, '1', 1, 'KIMBERG CLARK LEVER', '11', NULL, '271', '', NULL, NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 14
  ('ABDOMINAL BINDER(S)', NULL, 'UABD015', '15', '0', 0, '1', 1, 'MEDICARE LIMITED', '10', NULL, '271', '', NULL, NULL, FALSE, FALSE, 1, NOW(), NOW()),

  -- Row 15
  ('ABGEL [REGULAR]', 'SURGICAL PROUDOCT', 'UABREGO', '16', '2', 0, '1', 1, 'SHRI KRISHNA KESHAV', '12', NULL, '295', '', 'Pack', NULL, FALSE, FALSE, 1, NOW(), NOW())

ON CONFLICT (name) DO UPDATE SET
  generic_name = COALESCE(EXCLUDED.generic_name, medication.generic_name),
  item_code = EXCLUDED.item_code,
  drug_id_external = EXCLUDED.drug_id_external,
  stock = EXCLUDED.stock,
  pack_size = EXCLUDED.pack_size,
  manufacturer = EXCLUDED.manufacturer,
  updated_at = NOW();

-- Verification
SELECT COUNT(*) as inserted_count FROM public.medication;
SELECT * FROM public.medication ORDER BY created_at DESC LIMIT 10;
