-- =====================================================
-- DIRECT IMPORT TO MEDICATION TABLE (No pharmacy_items needed)
-- =====================================================

-- This script allows you to import data directly to medication table
-- without creating pharmacy_items table first

-- =====================================================
-- METHOD 1: Import from CSV file
-- =====================================================

-- Step 1: First, create a CSV file from pharmacy_items.sql data
-- Extract INSERT statements and convert to CSV format

-- Step 2: Import using COPY command
/*
COPY medication (
  name,
  generic_name,
  item_code,
  drug_id_external,
  stock,
  loose_stock_quantity,
  pack_size,
  minimum_stock,
  maximum_stock,
  reorder_level,
  manufacturer,
  manufacturer_id,
  supplier_name,
  supplier_id,
  shelf,
  exp_date,
  dosage_form,
  route,
  therapeutic_category,
  strength,
  med_strength_uom,
  profit_percentage,
  expensive_product,
  gen_ward_discount,
  spcl_ward_discount,
  dlx_ward_discount,
  is_deleted,
  is_implant,
  item_type,
  is_common,
  is_favourite
)
FROM '/path/to/medications.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');
*/

-- =====================================================
-- METHOD 2: Manual INSERT (Sample format)
-- =====================================================

-- Use this format to manually insert medicines from pharmacy_items.sql

INSERT INTO medication (
  name, generic_name, item_code, drug_id_external, stock, pack_size,
  manufacturer, manufacturer_id, supplier_name, supplier_id,
  dosage_form, is_deleted, item_type
) VALUES
  ('1-AL TAB', 'LEVOCETRIZINE', 'T1AL001', '1', '0', 10, 'FDC LIMITED', '1', NULL, NULL, 'Pack', FALSE, 1),
  ('3D FLAM INJ', 'DICLOFENAC SODIUM', 'I3DF001', '2', '0', 3, 'INTAS PHARMACEUTICALS LTD.', '2', NULL, NULL, NULL, FALSE, 1),
  ('7-LA SYP', NULL, 'S7LA001', '3', '0', 1, 'FDC LIMITED', '1', 'BOMBAY MEDICOS', '255', NULL, FALSE, 1),
  ('A TO Z TAB', NULL, 'TA-Z000', '5', '0', 15, 'ALKEM LAB', '4', NULL, '255', NULL, FALSE, 1),
  ('A-TO-Z SYP 200ML', NULL, 'SAZS001', '6', '0', 1, 'ALKEM LAB', '4', NULL, '261', 'Syrup', FALSE, 1),
  ('AALCETAMOL-100ML INJ', 'PARACETAMOL', 'IAAL001', '7', '0', 1, 'ALCON LABORATORIES INDIA PVT L', '5', NULL, '414', NULL, FALSE, 1),
  ('AB-CEF O 200 TAB', 'CEFIXIME & OFLOXACIN', 'TTAB033', '8', '0', 10, 'SHIELD HEALTHCARE PVT.LTD', '3', NULL, '285', NULL, FALSE, 1)
ON CONFLICT (name) DO NOTHING;

-- Add more INSERT statements as needed...

-- =====================================================
-- METHOD 3: Create temporary import function
-- =====================================================

CREATE OR REPLACE FUNCTION import_single_medicine(
  p_name TEXT,
  p_generic TEXT,
  p_item_code TEXT,
  p_drug_id TEXT,
  p_stock TEXT,
  p_pack INTEGER,
  p_manufacturer TEXT,
  p_manufacturer_id TEXT,
  p_supplier_name TEXT,
  p_supplier_id TEXT,
  p_dosage_form TEXT,
  p_is_deleted BOOLEAN,
  p_item_type INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO medication (
    name, generic_name, item_code, drug_id_external, stock, pack_size,
    manufacturer, manufacturer_id, supplier_name, supplier_id,
    dosage_form, is_deleted, item_type, created_at, updated_at
  ) VALUES (
    p_name, p_generic, p_item_code, p_drug_id, p_stock, p_pack,
    p_manufacturer, p_manufacturer_id, p_supplier_name, p_supplier_id,
    p_dosage_form, p_is_deleted, p_item_type, NOW(), NOW()
  )
  ON CONFLICT (name) DO UPDATE SET
    generic_name = EXCLUDED.generic_name,
    item_code = EXCLUDED.item_code,
    stock = EXCLUDED.stock,
    pack_size = EXCLUDED.pack_size,
    manufacturer = EXCLUDED.manufacturer,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Usage example:
/*
SELECT import_single_medicine(
  '1-AL TAB',                -- name
  'LEVOCETRIZINE',           -- generic_name
  'T1AL001',                 -- item_code
  '1',                       -- drug_id_external
  '0',                       -- stock
  10,                        -- pack_size
  'FDC LIMITED',             -- manufacturer
  '1',                       -- manufacturer_id
  NULL,                      -- supplier_name
  NULL,                      -- supplier_id
  'Pack',                    -- dosage_form
  FALSE,                     -- is_deleted
  1                          -- item_type
);
*/

-- =====================================================
-- Verification
-- =====================================================

SELECT COUNT(*) FROM medication;
SELECT * FROM medication ORDER BY created_at DESC LIMIT 10;
