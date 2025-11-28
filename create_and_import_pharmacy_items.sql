-- =====================================================
-- CREATE pharmacy_items TABLE (PostgreSQL format)
-- Then import data from pharmacy_items.sql
-- =====================================================

-- Step 1: Create pharmacy_items table in PostgreSQL
DROP TABLE IF EXISTS pharmacy_items CASCADE;

CREATE TABLE pharmacy_items (
  id SERIAL PRIMARY KEY,
  drug_id INTEGER NOT NULL,
  code VARCHAR(255),
  product_name VARCHAR(255),
  name TEXT NOT NULL,
  etc VARCHAR(50),
  DrugInfo VARCHAR(255),
  manufacturer VARCHAR(100),
  manufacturer_company_id INTEGER,
  Status VARCHAR(100),
  TouchDate VARCHAR(100),
  DrugTypeID VARCHAR(100),
  item_code VARCHAR(255),
  pack INTEGER DEFAULT 1,
  stock DOUBLE PRECISION DEFAULT 0,
  loose_stock INTEGER,
  generic VARCHAR(255),
  date VARCHAR(255),
  minimum INTEGER,
  maximum INTEGER,
  expiry_date VARCHAR(255),
  shelf VARCHAR(255),
  supplier_name VARCHAR(255),
  supplier_id INTEGER,
  is_deleted BOOLEAN DEFAULT FALSE,
  common INTEGER,
  favourite INTEGER,
  home INTEGER,
  user_id INTEGER,
  patient_info TEXT,
  patient_info_link VARCHAR(255),
  patient_info_created_by INTEGER,
  DosageForm VARCHAR(255),
  Route VARCHAR(255),
  TheraputicCategory TEXT,
  reorder_level INTEGER,
  create_time TIMESTAMP,
  created_by INTEGER,
  location_id INTEGER,
  cust_name VARCHAR(255),
  doseForm VARCHAR(255),
  vat_class_id INTEGER,
  MED_STRENGTH VARCHAR(255),
  MED_STRENGTH_UOM VARCHAR(255),
  MED_ROUTE_ABBR VARCHAR(255),
  expensive_product BOOLEAN DEFAULT FALSE,
  profit_percentage INTEGER,
  gen_ward_discount REAL,
  spcl_ward_discount REAL,
  dlx_ward_discount REAL,
  semi_spcl_ward_discount REAL,
  islolation_ward_discount REAL,
  opdgeneral_ward_discount REAL,
  item_type VARCHAR(10) DEFAULT '1',
  is_implant INTEGER
);

-- Create indexes
CREATE INDEX idx_pharmacy_items_drug_id ON pharmacy_items(drug_id);
CREATE INDEX idx_pharmacy_items_item_code ON pharmacy_items(item_code);
CREATE INDEX idx_pharmacy_items_name ON pharmacy_items(name);
CREATE INDEX idx_pharmacy_items_deleted ON pharmacy_items(is_deleted);

-- =====================================================
-- Step 2: Now you need to import data
-- =====================================================

-- Option A: If you have CSV export from pharmacy_items
-- COPY pharmacy_items FROM '/path/to/pharmacy_items.csv' WITH (FORMAT csv, HEADER true);

-- Option B: Use pgloader to convert MySQL dump to PostgreSQL
-- Command line:
-- pgloader mysql://user:password@localhost/db_HopeHospital postgresql://user:password@localhost/your_database

-- Option C: Manual INSERT statements from pharmacy_items.sql
-- Since the file is 8.7MB, you'll need to:
-- 1. Open pharmacy_items.sql in a text editor
-- 2. Find all INSERT INTO statements
-- 3. Convert MySQL syntax to PostgreSQL:
--    - Change backticks to nothing or double quotes
--    - Change '0'/'1' to FALSE/TRUE for boolean fields
-- 4. Run the INSERT statements

-- =====================================================
-- Step 3: After importing, verify the data
-- =====================================================

SELECT COUNT(*) as total_items FROM pharmacy_items;
SELECT COUNT(*) as active_items FROM pharmacy_items WHERE is_deleted = FALSE;

-- Sample data
SELECT
  id,
  name,
  generic,
  item_code,
  stock,
  manufacturer,
  supplier_name
FROM pharmacy_items
WHERE is_deleted = FALSE
LIMIT 10;

-- =====================================================
-- Step 4: Then run the import script
-- =====================================================
-- After pharmacy_items table has data, run:
-- psql -f pharmacy_items_data_import.sql
