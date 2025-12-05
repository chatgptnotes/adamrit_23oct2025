# 🚨 URGENT: Fix Database Column Types

## 🔴 Current Error:

```
Error saving sale: Failed to save sale: invalid input syntax for type integer: "UHAY25F27002"
```

**Meaning**: Database columns are still **INTEGER** type, not **VARCHAR**.

---

## ✅ Fix in 3 Steps:

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### **Step 2: Copy & Paste This SQL**

```sql
-- Change patient_id to VARCHAR
ALTER TABLE public.pharmacy_sales
ALTER COLUMN patient_id TYPE VARCHAR(255) USING COALESCE(patient_id::VARCHAR, NULL);

-- Change visit_id to VARCHAR
ALTER TABLE public.pharmacy_sales
ALTER COLUMN visit_id TYPE VARCHAR(255) USING COALESCE(visit_id::VARCHAR, NULL);
```

### **Step 3: Click RUN (or Ctrl+Enter)**

**Expected Output:**
```
Success. No rows returned.
```

---

## 🔍 Verify It Worked

Run this query:

```sql
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pharmacy_sales'
AND column_name IN ('patient_id', 'visit_id');
```

**Expected Result:**
```
column_name | data_type            | character_maximum_length
------------|----------------------|-------------------------
patient_id  | character varying    | 255
visit_id    | character varying    | 255
```

✅ **If you see "character varying" → Success!**

---

## 🧪 Test Your App

### After running SQL:

1. **Go back to your app**: localhost:8080/pharmacy
2. **Fill form**:
   - Patient ID: UHAY25F27002
   - Visit ID: IH25F27004
   - Patient Name: Diya
3. **Add Paracetamol**
4. **Click "Complete Sale"**

### Expected:
```
✅ Sale completed successfully! Sale ID: 3
```

---

## 📊 Check Saved Data

In Supabase, go to **Table Editor** → **pharmacy_sales**

**You should see**:
| sale_id | patient_id | visit_id | patient_name | total_amount |
|---------|------------|----------|--------------|--------------|
| 3 | UHAY25F27002 | IH25F27004 | Diya | 11.20 |

✅ **String IDs saved correctly!**

---

## 📋 Quick Steps Summary

1. ✅ Open Supabase SQL Editor
2. ✅ Copy ALTER TABLE commands above
3. ✅ Paste & RUN
4. ✅ Test app again
5. ✅ Verify data saved

---

**Priority**: 🚨 HIGH - Run immediately!
**Time**: 30 seconds
