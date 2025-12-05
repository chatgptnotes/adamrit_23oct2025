# Pharmacy Items Migration Documentation

## Overview
This migration integrates data from `pharmacy_items.sql` (MySQL format) into your existing PostgreSQL `medication` table and creates a complete pharmacy billing system.

---

## 📋 Important Columns from pharmacy_items.sql

### 🔴 **Critical Fields** (Must Have)
| Column | Description | Example |
|--------|-------------|---------|
| `drug_id` | Unique drug identifier | 1, 2, 3 |
| `item_code` | Product item code | T1AL001, I3DF001 |
| `name` | Medicine name | Paracetamol 500mg |
| `generic` | Generic name | LEVOCETRIZINE |
| `pack` | Pack size | 10, 15, 1 |
| `stock` | Current stock | 100, 50 |
| `loose_stock` | Individual units | 5, 10 |
| `minimum` | Min stock level | 20 |
| `maximum` | Max stock level | 500 |
| `reorder_level` | Reorder threshold | 50 |
| `expiry_date` | Expiry date | 2025-12-31 |
| `shelf` | Shelf location | A1, B2 |
| `supplier_name` | Supplier name | BOMBAY MEDICOS |
| `supplier_id` | Supplier ID | 255 |
| `manufacturer` | Manufacturer name | FDC LIMITED |
| `is_deleted` | Soft delete flag | 0/1 |

### 🟡 **Important Business Fields**
| Column | Description | Example |
|--------|-------------|---------|
| `manufacturer_company_id` | Manufacturer ID | 1, 2, 3 |
| `DosageForm` | Medicine form | Tablet, Syrup, Injection |
| `Route` | Administration route | Oral, IV, IM |
| `TheraputicCategory` | Medical category | Antibiotic, Painkiller |
| `MED_STRENGTH` | Strength | 500mg, 200ml |
| `MED_STRENGTH_UOM` | Unit of measure | mg, ml, g |
| `expensive_product` | High-value flag | 0/1 |
| `profit_percentage` | Profit margin | 25, 30 |
| `item_type` | 1=Medicine, 2=Stationary | 1, 2 |
| `is_implant` | Implant flag | 0/1 |

### 🟢 **Optional Fields**
| Column | Description |
|--------|-------------|
| `common` | Commonly used |
| `favourite` | Favorite items |
| `gen_ward_discount` | General ward discount % |
| `spcl_ward_discount` | Special ward discount % |
| `dlx_ward_discount` | Deluxe ward discount % |

---

## 🚀 Migration Steps

### **Step 1: Enhance Medication Table**
Run this first to add new columns:
```bash
psql -U your_user -d your_database -f medication_enhancement_migration.sql
```

**What it does:**
- Adds 25+ new columns to `medication` table
- Creates indexes for performance
- Adds documentation comments
- Updates default values

**New Columns Added:**
- Stock management: `loose_stock_quantity`, `minimum_stock`, `maximum_stock`, `reorder_level`, `pack_size`
- Product IDs: `drug_id_external`, `product_code`
- Medicine details: `dosage_form`, `route`, `therapeutic_category`, `med_strength_uom`
- Business: `profit_percentage`, `expensive_product`
- Ward discounts: `gen_ward_discount`, `spcl_ward_discount`, etc.
- Flags: `is_common`, `is_favourite`

---

### **Step 2: Import pharmacy_items Data**

#### Option A: Direct Import (if pharmacy_items table exists)
```bash
psql -U your_user -d your_database -f pharmacy_items_data_import.sql
```

#### Option B: Manual Import (if using pharmacy_items.sql file)
1. First, import the MySQL dump to PostgreSQL:
```bash
# Convert MySQL to PostgreSQL (if needed)
# Use tools like mysql2postgres or pgloader
```

2. Then run the import script:
```bash
psql -U your_user -d your_database -f pharmacy_items_data_import.sql
```

**What it does:**
- Maps all pharmacy_items columns to medication table
- Handles data type conversions (MySQL → PostgreSQL)
- Inserts new records
- Updates existing records (based on `name` field)
- Imports only active items (`is_deleted = 0`)

**Data Mapping:**
- `pharmacy_items.name` → `medication.name`
- `pharmacy_items.generic` → `medication.generic_name`
- `pharmacy_items.drug_id` → `medication.drug_id_external`
- `pharmacy_items.stock` → `medication.stock`
- And 40+ more mappings...

---

### **Step 3: Create Pharmacy Sales System**
Run this to create complete billing system:
```bash
psql -U your_user -d your_database -f pharmacy_sales_complete_schema.sql
```

**What it creates:**

#### Tables:
1. **pharmacy_sales** (Parent)
   - Sale header information
   - Patient details
   - Payment info
   - Financial totals

2. **pharmacy_sale_items** (Child)
   - Individual medicine items
   - Linked to `medication` table
   - Pricing, discounts, quantities

#### Views:
1. **v_pharmacy_sales_complete** - Complete sales with medication details
2. **v_pharmacy_today_sales** - Today's sales summary
3. **v_pharmacy_low_stock_alert** - Low stock medications

#### Functions:
1. **create_pharmacy_sale()** - Insert complete sale with items in one call

---

## 📊 Database Structure

### Relationships:
```
medication (medication table)
    ↑
    | (One-to-Many)
    |
pharmacy_sale_items (sale items)
    ↑
    | (Many-to-One)
    |
pharmacy_sales (sale header)
```

---

## 🔍 Usage Examples

### 1. Get Patient Sale History
```sql
SELECT *
FROM v_pharmacy_sales_complete
WHERE patient_id = 123
ORDER BY sale_date DESC;
```

### 2. Check Low Stock Medicines
```sql
SELECT * FROM v_pharmacy_low_stock_alert;
```

### 3. Today's Sales Summary
```sql
SELECT * FROM v_pharmacy_today_sales;
```

### 4. Create New Sale (Using Function)
```sql
SELECT create_pharmacy_sale(
    'OPD',                    -- sale_type
    123,                      -- patient_id
    'Ram Kumar',              -- patient_name
    456,                      -- visit_id
    'CASH',                   -- payment_method
    '[
        {
            "medication_id": "uuid-here",
            "medication_name": "Paracetamol 500mg",
            "quantity": 2,
            "unit_price": 50.00,
            "discount": 5.00
        },
        {
            "medication_id": "uuid-here-2",
            "medication_name": "Crocin",
            "quantity": 1,
            "unit_price": 150.00,
            "discount": 0
        }
    ]'::jsonb
);
```

### 5. Get Medicine Details with Stock
```sql
SELECT
    name,
    generic_name,
    item_code,
    stock,
    loose_stock_quantity,
    pack_size,
    reorder_level,
    minimum_stock,
    supplier_name,
    manufacturer,
    shelf,
    exp_date
FROM medication
WHERE is_deleted = FALSE
  AND CAST(stock AS INTEGER) > 0
ORDER BY name;
```

---

## ⚠️ Important Notes

1. **Run in Order**: Execute migrations in sequence (1 → 2 → 3)

2. **Backup First**: Always backup your database before migration
   ```bash
   pg_dump -U user -d database > backup_$(date +%Y%m%d).sql
   ```

3. **Data Conflicts**: The import script uses `ON CONFLICT (name) DO UPDATE`
   - Existing medicines will be updated
   - New medicines will be inserted

4. **Foreign Keys**: Ensure these tables exist before running sales schema:
   - `medication` table
   - `patients` table (if using patient_id FK)
   - `patient_visits` table (if using visit_id FK)

5. **Data Types**:
   - MySQL `INT` → PostgreSQL `INTEGER`
   - MySQL `AUTO_INCREMENT` → PostgreSQL `SERIAL`
   - MySQL `ENUM` → PostgreSQL `VARCHAR` with `CHECK` constraint

---

## 🧪 Verification

After migration, run these checks:

```sql
-- 1. Check medication table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'medication'
ORDER BY ordinal_position;

-- 2. Count records
SELECT
    COUNT(*) as total_medications,
    COUNT(*) FILTER (WHERE is_deleted = FALSE) as active_count,
    COUNT(*) FILTER (WHERE is_implant = TRUE) as implant_count,
    COUNT(*) FILTER (WHERE expensive_product = TRUE) as expensive_count
FROM medication;

-- 3. Check sales tables
SELECT COUNT(*) FROM pharmacy_sales;
SELECT COUNT(*) FROM pharmacy_sale_items;

-- 4. Sample data
SELECT * FROM medication LIMIT 10;
```

---

## 📝 Files Created

1. **medication_enhancement_migration.sql** - Adds columns to medication table
2. **pharmacy_items_data_import.sql** - Imports pharmacy_items data
3. **pharmacy_sales_complete_schema.sql** - Complete billing system
4. **PHARMACY_MIGRATION_README.md** - This documentation

---

## 🆘 Troubleshooting

### Issue: "relation already exists"
**Solution**: Tables already exist. Either:
- Drop tables first: `DROP TABLE IF EXISTS pharmacy_sales CASCADE;`
- Or skip creation and only run inserts

### Issue: "foreign key constraint fails"
**Solution**: Referenced tables don't exist. Comment out FK constraints:
```sql
-- CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
```

### Issue: "column does not exist"
**Solution**: Run enhancement migration first (Step 1)

---

## 📞 Support

For issues or questions, refer to:
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Your DBA or development team

---

**Created**: 2025-10-07
**Version**: 1.0
**Database**: PostgreSQL 12+
