-- =====================================================
-- MEDICATION TABLE ENHANCEMENT MIGRATION
-- Adding important fields from pharmacy_items.sql
-- =====================================================

-- Step 1: Add new columns to existing medication table
ALTER TABLE medication
  -- Stock Management
  ADD COLUMN IF NOT EXISTS loose_stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_stock INTEGER,
  ADD COLUMN IF NOT EXISTS maximum_stock INTEGER,
  ADD COLUMN IF NOT EXISTS reorder_level INTEGER,
  ADD COLUMN IF NOT EXISTS pack_size INTEGER DEFAULT 1,

  -- Product Identification
  ADD COLUMN IF NOT EXISTS drug_id_external TEXT,
  ADD COLUMN IF NOT EXISTS product_code TEXT,

  -- Medicine Details
  ADD COLUMN IF NOT EXISTS dosage_form TEXT,
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS therapeutic_category TEXT,
  ADD COLUMN IF NOT EXISTS med_strength_uom TEXT,

  -- Business Fields
  ADD COLUMN IF NOT EXISTS profit_percentage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS expensive_product BOOLEAN DEFAULT FALSE,

  -- Ward-based Discounts
  ADD COLUMN IF NOT EXISTS gen_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS spcl_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS dlx_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS semi_spcl_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS isolation_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS opd_general_ward_discount DECIMAL(5,2),

  -- Flags
  ADD COLUMN IF NOT EXISTS is_common BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_favourite BOOLEAN DEFAULT FALSE,

  -- Additional Info
  ADD COLUMN IF NOT EXISTS patient_info TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medication_drug_id ON medication(drug_id_external);
CREATE INDEX IF NOT EXISTS idx_medication_product_code ON medication(product_code);
CREATE INDEX IF NOT EXISTS idx_medication_item_code ON medication(item_code);
CREATE INDEX IF NOT EXISTS idx_medication_barcode ON medication(barcode);
CREATE INDEX IF NOT EXISTS idx_medication_supplier ON medication(supplier_id);
CREATE INDEX IF NOT EXISTS idx_medication_manufacturer ON medication(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_medication_reorder ON medication(reorder_level) WHERE reorder_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medication_stock ON medication(stock);
CREATE INDEX IF NOT EXISTS idx_medication_deleted ON medication(is_deleted) WHERE is_deleted = FALSE;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN medication.loose_stock_quantity IS 'Individual unit stock (strips, vials, etc.)';
COMMENT ON COLUMN medication.minimum_stock IS 'Minimum stock threshold for alerts';
COMMENT ON COLUMN medication.maximum_stock IS 'Maximum stock capacity';
COMMENT ON COLUMN medication.reorder_level IS 'Stock level to trigger automatic reorder';
COMMENT ON COLUMN medication.pack_size IS 'Number of units per pack/box';
COMMENT ON COLUMN medication.drug_id_external IS 'External drug ID from pharmacy_items';
COMMENT ON COLUMN medication.product_code IS 'Product identification code';
COMMENT ON COLUMN medication.dosage_form IS 'Form of medicine: Tablet, Syrup, Injection, etc.';
COMMENT ON COLUMN medication.route IS 'Route of administration: Oral, IV, IM, etc.';
COMMENT ON COLUMN medication.therapeutic_category IS 'Medical/therapeutic category';
COMMENT ON COLUMN medication.med_strength_uom IS 'Unit of measurement for strength (mg, ml, etc.)';
COMMENT ON COLUMN medication.profit_percentage IS 'Profit margin percentage';
COMMENT ON COLUMN medication.expensive_product IS 'Flag for high-value medicines';
COMMENT ON COLUMN medication.gen_ward_discount IS 'Discount percentage for general ward';
COMMENT ON COLUMN medication.is_common IS 'Commonly used medicine flag';
COMMENT ON COLUMN medication.is_favourite IS 'Favourite/frequently used flag';

-- Step 4: Update existing records with default values where needed
UPDATE medication
SET
  pack_size = COALESCE(pack_size, 1),
  loose_stock_quantity = COALESCE(loose_stock_quantity, 0),
  expensive_product = COALESCE(expensive_product, FALSE),
  is_common = COALESCE(is_common, FALSE),
  is_favourite = COALESCE(is_favourite, FALSE),
  is_deleted = COALESCE(is_deleted, FALSE),
  is_implant = COALESCE(is_implant, FALSE)
WHERE pack_size IS NULL
   OR loose_stock_quantity IS NULL
   OR expensive_product IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check updated table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'medication'
ORDER BY ordinal_position;

-- Check total medications count
SELECT
  COUNT(*) as total_medications,
  COUNT(*) FILTER (WHERE is_deleted = TRUE) as deleted_count,
  COUNT(*) FILTER (WHERE is_deleted = FALSE) as active_count,
  COUNT(*) FILTER (WHERE is_implant = TRUE) as implant_count,
  COUNT(*) FILTER (WHERE expensive_product = TRUE) as expensive_count
FROM medication;
