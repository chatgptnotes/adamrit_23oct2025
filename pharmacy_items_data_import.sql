-- =====================================================
-- DATA IMPORT FROM pharmacy_items.sql TO medication table
-- =====================================================

-- IMPORTANT: Run medication_enhancement_migration.sql first!

-- =====================================================
-- Option 1: If converting from MySQL pharmacy_items
-- =====================================================

-- This query maps pharmacy_items columns to medication table
-- Adjust the source table name if pharmacy_items is already imported

INSERT INTO medication (
  -- Basic Info
  name,
  generic_name,
  category,
  dosage,
  description,

  -- Product Codes
  medicine_code,
  barcode,
  item_code,
  drug_id_external,
  product_code,

  -- Medicine Details
  strength,
  dosage_form,
  route,
  therapeutic_category,
  med_strength_uom,

  -- Stock Management
  stock,
  loose_stock,
  pack,
  minimum_stock,
  maximum_stock,
  reorder_level,
  loose_stock_quantity,
  pack_size,

  -- Supplier/Manufacturer
  manufacturer,
  manufacturer_id,
  supplier_name,
  supplier_id,
  shelf,

  -- Pricing & Business
  cost,
  price_per_strip,
  profit_percentage,
  expensive_product,

  -- Ward Discounts
  gen_ward_discount,
  spcl_ward_discount,
  dlx_ward_discount,
  semi_spcl_ward_discount,
  isolation_ward_discount,
  opd_general_ward_discount,

  -- Dates & Status
  exp_date,
  status,

  -- Flags
  is_deleted,
  is_implant,
  item_type,
  is_common,
  is_favourite,

  -- Additional Info
  patient_info,

  -- Timestamps
  created_at,
  updated_at
)
SELECT
  -- Basic Info
  TRIM(pi.name) as name,
  TRIM(pi.generic) as generic_name,
  NULL as category,  -- Not in pharmacy_items
  NULL as dosage,     -- Not in pharmacy_items
  CASE
    WHEN pi.DrugInfo != '' THEN pi.DrugInfo
    ELSE NULL
  END as description,

  -- Product Codes
  NULLIF(TRIM(pi.code), '') as medicine_code,
  NULL as barcode,  -- Not in pharmacy_items
  TRIM(pi.item_code) as item_code,
  pi.drug_id::TEXT as drug_id_external,
  NULLIF(TRIM(pi.product_name), '') as product_code,

  -- Medicine Details
  NULLIF(TRIM(pi.MED_STRENGTH), '') as strength,
  NULLIF(TRIM(pi.DosageForm), '') as dosage_form,
  NULLIF(TRIM(pi.Route), '') as route,
  NULLIF(TRIM(pi.TheraputicCategory), '') as therapeutic_category,
  NULLIF(TRIM(pi.MED_STRENGTH_UOM), '') as med_strength_uom,

  -- Stock Management
  CAST(COALESCE(pi.stock, 0) AS VARCHAR) as stock,
  pi.loose_stock as loose_stock,
  CAST(COALESCE(pi.pack, 1) AS TEXT) as pack,
  pi.minimum as minimum_stock,
  pi.maximum as maximum_stock,
  pi.reorder_level as reorder_level,
  COALESCE(pi.loose_stock, 0) as loose_stock_quantity,
  COALESCE(pi.pack, 1) as pack_size,

  -- Supplier/Manufacturer
  NULLIF(TRIM(pi.manufacturer), '') as manufacturer,
  CAST(pi.manufacturer_company_id AS VARCHAR) as manufacturer_id,
  NULLIF(TRIM(pi.supplier_name), '') as supplier_name,
  CAST(pi.supplier_id AS TEXT) as supplier_id,
  NULLIF(TRIM(pi.shelf), '') as shelf,

  -- Pricing & Business
  NULL as cost,  -- Need price data
  NULL as price_per_strip,  -- Need price data
  pi.profit_percentage as profit_percentage,
  COALESCE(pi.expensive_product::BOOLEAN, FALSE) as expensive_product,

  -- Ward Discounts
  pi.gen_ward_discount as gen_ward_discount,
  pi.spcl_ward_discount as spcl_ward_discount,
  pi.dlx_ward_discount as dlx_ward_discount,
  pi.semi_spcl_ward_discount as semi_spcl_ward_discount,
  pi.islolation_ward_discount as isolation_ward_discount,
  pi.opdgeneral_ward_discount as opd_general_ward_discount,

  -- Dates & Status
  CASE
    WHEN pi.expiry_date IS NOT NULL AND pi.expiry_date != ''
    THEN TO_DATE(pi.expiry_date, 'YYYY-MM-DD')
    ELSE NULL
  END as exp_date,
  NULLIF(TRIM(pi.Status), '') as status,

  -- Flags
  COALESCE(pi.is_deleted::BOOLEAN, FALSE) as is_deleted,
  COALESCE(pi.is_implant::BOOLEAN, FALSE) as is_implant,
  CASE
    WHEN pi.item_type = '1' THEN 1  -- Medicine
    WHEN pi.item_type = '2' THEN 2  -- Stationary
    ELSE 1
  END as item_type,
  COALESCE((pi.common = 1), FALSE) as is_common,
  COALESCE((pi.favourite = 1), FALSE) as is_favourite,

  -- Additional Info
  NULLIF(TRIM(pi.patient_info), '') as patient_info,

  -- Timestamps
  COALESCE(pi.create_time, NOW()) as created_at,
  NOW() as updated_at

FROM pharmacy_items pi
WHERE pi.is_deleted = 0  -- Only import active items
  AND TRIM(pi.name) != ''  -- Must have a name
ON CONFLICT (name) DO UPDATE SET
  -- Update existing records with additional data
  generic_name = COALESCE(EXCLUDED.generic_name, medication.generic_name),
  item_code = COALESCE(EXCLUDED.item_code, medication.item_code),
  drug_id_external = COALESCE(EXCLUDED.drug_id_external, medication.drug_id_external),
  stock = EXCLUDED.stock,
  loose_stock_quantity = EXCLUDED.loose_stock_quantity,
  pack_size = EXCLUDED.pack_size,
  minimum_stock = EXCLUDED.minimum_stock,
  maximum_stock = EXCLUDED.maximum_stock,
  reorder_level = EXCLUDED.reorder_level,
  manufacturer = COALESCE(EXCLUDED.manufacturer, medication.manufacturer),
  supplier_name = COALESCE(EXCLUDED.supplier_name, medication.supplier_name),
  supplier_id = COALESCE(EXCLUDED.supplier_id, medication.supplier_id),
  shelf = COALESCE(EXCLUDED.shelf, medication.shelf),
  dosage_form = COALESCE(EXCLUDED.dosage_form, medication.dosage_form),
  route = COALESCE(EXCLUDED.route, medication.route),
  therapeutic_category = COALESCE(EXCLUDED.therapeutic_category, medication.therapeutic_category),
  profit_percentage = COALESCE(EXCLUDED.profit_percentage, medication.profit_percentage),
  expensive_product = EXCLUDED.expensive_product,
  is_common = EXCLUDED.is_common,
  is_favourite = EXCLUDED.is_favourite,
  updated_at = NOW();


-- =====================================================
-- POST-IMPORT VERIFICATION
-- =====================================================

-- Check imported data
SELECT
  'Total Imported' as description,
  COUNT(*) as count
FROM medication
UNION ALL
SELECT
  'With Stock Info',
  COUNT(*)
FROM medication
WHERE stock IS NOT NULL
UNION ALL
SELECT
  'With Supplier',
  COUNT(*)
FROM medication
WHERE supplier_name IS NOT NULL
UNION ALL
SELECT
  'With Manufacturer',
  COUNT(*)
FROM medication
WHERE manufacturer IS NOT NULL
UNION ALL
SELECT
  'Implants',
  COUNT(*)
FROM medication
WHERE is_implant = TRUE
UNION ALL
SELECT
  'Expensive Products',
  COUNT(*)
FROM medication
WHERE expensive_product = TRUE
UNION ALL
SELECT
  'Common Medicines',
  COUNT(*)
FROM medication
WHERE is_common = TRUE;

-- Sample data check
SELECT
  id,
  name,
  generic_name,
  item_code,
  stock,
  pack_size,
  manufacturer,
  supplier_name,
  reorder_level,
  is_implant
FROM medication
WHERE is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 10;
