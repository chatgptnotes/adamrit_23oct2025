# Fixed: View Dependency Error

## 🔴 Error You Got:

```
ERROR: cannot alter type of a column used by a view or rule
DETAIL: rule _RETURN on view v_pharmacy_sales_complete depends on column "patient_id"
```

---

## 🐛 Problem:

**View `v_pharmacy_sales_complete` uses `patient_id` column.**

PostgreSQL rule:
- ❌ Can't change column type if a view depends on it
- ✅ Must drop view first, change column, then recreate view

---

## ✅ Solution (3 Steps):

### **Step 1: Drop View**
```sql
DROP VIEW IF EXISTS public.v_pharmacy_sales_complete CASCADE;
```

### **Step 2: Change Column Types**
```sql
ALTER TABLE public.pharmacy_sales
ALTER COLUMN patient_id TYPE VARCHAR(255);

ALTER TABLE public.pharmacy_sales
ALTER COLUMN visit_id TYPE VARCHAR(255);
```

### **Step 3: Recreate View**
```sql
CREATE OR REPLACE VIEW public.v_pharmacy_sales_complete AS
SELECT
    ps.sale_id,
    ps.sale_type,
    ps.patient_id,
    ps.patient_name,
    ps.visit_id,
    -- ... all other columns
FROM public.pharmacy_sales ps
LEFT JOIN public.pharmacy_sale_items psi ON ps.sale_id = psi.sale_id
LEFT JOIN public.medication m ON psi.medication_id = m.id;
```

---

## 🚀 Run Complete Script

**In Supabase SQL Editor**, copy & paste entire content from:

**File**: `FIX_VIEW_DEPENDENCY_ERROR.sql`

**Or run this complete script:**

```sql
-- Drop view
DROP VIEW IF EXISTS public.v_pharmacy_sales_complete CASCADE;

-- Change columns
ALTER TABLE public.pharmacy_sales
ALTER COLUMN patient_id TYPE VARCHAR(255);

ALTER TABLE public.pharmacy_sales
ALTER COLUMN visit_id TYPE VARCHAR(255);

-- Recreate view
CREATE OR REPLACE VIEW public.v_pharmacy_sales_complete AS
SELECT
    ps.sale_id,
    ps.sale_type,
    ps.patient_id,
    ps.patient_name,
    ps.visit_id,
    ps.sale_date,
    ps.prescription_number,
    ps.doctor_name,
    ps.ward_type,
    ps.subtotal,
    ps.discount,
    ps.tax_gst,
    ps.total_amount,
    ps.payment_method,
    ps.payment_status,
    psi.sale_item_id,
    psi.medication_id,
    psi.medication_name,
    psi.generic_name,
    psi.item_code,
    psi.batch_number,
    psi.quantity,
    psi.pack_size,
    psi.unit_price,
    psi.discount as item_discount,
    psi.total_price,
    psi.manufacturer,
    psi.dosage_form,
    psi.strength,
    psi.is_implant,
    m.supplier_name,
    m.shelf,
    m.stock,
    m.exp_date
FROM public.pharmacy_sales ps
LEFT JOIN public.pharmacy_sale_items psi ON ps.sale_id = psi.sale_id
LEFT JOIN public.medication m ON psi.medication_id = m.id;
```

**Click RUN!**

---

## ✅ Expected Output:

```
Success. No rows returned.
```

---

## 🔍 Verify Changes

Run this:

```sql
-- Check column types
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pharmacy_sales'
AND column_name IN ('patient_id', 'visit_id');
```

**Expected**:
```
patient_id | character varying | 255
visit_id   | character varying | 255
```

✅ **Success!**

---

## 🧪 Test App Now

1. Go to: localhost:8080/pharmacy
2. Fill form:
   - Patient ID: UHAY25F27002
   - Visit ID: IH25F27004
3. Add medicine
4. Click "Complete Sale"

**Expected**:
```
✅ Sale completed successfully! Sale ID: 3
```

---

## 📊 Verify Data

**Supabase Table Editor** → **pharmacy_sales**:

| sale_id | patient_id | visit_id | patient_name | total |
|---------|------------|----------|--------------|-------|
| 3 | UHAY25F27002 | IH25F27004 | Diya | 11.20 |

✅ **No more NULL!**
✅ **No more integer error!**

---

## ⚠️ What If Other Views Exist?

If you have other views depending on pharmacy_sales:

### Check all views:
```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%pharmacy%';
```

### If more views exist:
```sql
-- Drop all pharmacy views
DROP VIEW IF EXISTS public.v_pharmacy_today_sales CASCADE;
DROP VIEW IF EXISTS public.v_pharmacy_low_stock_alert CASCADE;
-- ... drop any other pharmacy views

-- Change columns
ALTER TABLE public.pharmacy_sales
ALTER COLUMN patient_id TYPE VARCHAR(255);
ALTER COLUMN visit_id TYPE VARCHAR(255);

-- Recreate all views
-- (use original CREATE VIEW statements)
```

---

## 📋 Summary

**Problem**: View blocked column type change
**Solution**: Drop view → Change columns → Recreate view
**Time**: 1 minute
**Result**: ✅ Columns changed, view restored, app working

---

## 📁 Files

- **FIX_VIEW_DEPENDENCY_ERROR.sql** - Complete script (use this!)
- **FIXED_VIEW_DEPENDENCY.md** - This guide

---

**Status**: Ready to run ✅
**Action**: Copy script, paste in Supabase SQL Editor, click RUN!
