# Verify Pharmacy Sales Data Save

## ✅ Changes Applied

**File**: `PharmacyBilling.tsx`
- ✅ Import added: `savePharmacySale, SaleData`
- ✅ Save logic added (line 472-525)
- ✅ Now saves to `pharmacy_sales` and `pharmacy_sale_items`

---

## 🧪 Testing Steps

### Step 1: Open Pharmacy Billing Page
Navigate to pharmacy billing in your app

### Step 2: Fill Form
```
Sale Type: Other
Patient ID: 123
Patient Name: Test Patient
Visit ID: 456
```

### Step 3: Add Medicine to Cart
- Search for any medicine
- Add to cart with quantity

### Step 4: Select Payment
- Click CASH button

### Step 5: Complete Sale
- Click "Complete Sale - ₹XXX"

### Step 6: Check Alert
Should see:
```
✅ Sale completed successfully! Sale ID: 1
```

---

## 🔍 Verify in Supabase

### Check pharmacy_sales:
```sql
SELECT
  sale_id,
  patient_id,
  patient_name,
  visit_id,
  sale_type,
  subtotal,
  discount,
  tax_gst,
  total_amount,
  payment_method,
  payment_status,
  created_at
FROM pharmacy_sales
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
| sale_id | patient_id | patient_name | total_amount | payment_method |
|---------|------------|--------------|--------------|----------------|
| 1       | 123        | Test Patient | 109.00       | CASH           |

### Check pharmacy_sale_items:
```sql
SELECT
  sale_item_id,
  sale_id,
  medication_name,
  quantity,
  unit_price,
  total_price,
  created_at
FROM pharmacy_sale_items
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
| sale_item_id | sale_id | medication_name | quantity | unit_price | total_price |
|--------------|---------|-----------------|----------|------------|-------------|
| 1            | 1       | Paracetamol     | 2        | 50.00      | 100.00      |

---

## 🐛 Troubleshooting

### Issue: Alert shows error
**Check Console**: Open browser DevTools → Console tab
**Look for**: Error message from `savePharmacySale`

**Common Errors:**

#### 1. "relation pharmacy_sales does not exist"
**Solution**: Run migration first
```sql
-- In Supabase SQL Editor, run:
-- File: supabase_pharmacy_migration.sql
```

#### 2. "foreign key constraint fails"
**Solution**: Medicine must exist in `medication` table
```sql
-- Check if medicine exists:
SELECT id, name FROM medication LIMIT 5;

-- If empty, add sample medicine:
INSERT INTO medication (name, generic_name, item_code, stock, price_per_strip)
VALUES ('Paracetamol 500mg', 'PARACETAMOL', 'P001', '100', '50');
```

#### 3. "Cannot find module '@/lib/pharmacy-billing-service'"
**Solution**: Check file exists at:
```
src/lib/pharmacy-billing-service.ts
```

#### 4. "payment_method violates check constraint"
**Solution**: Must be one of: CASH, CARD, UPI, INSURANCE
Check the payment method being sent.

---

## 📊 Data Flow Verification

### Step-by-Step:
1. ✅ User fills form
2. ✅ Adds medicines to cart
3. ✅ Clicks "Complete Sale"
4. ✅ `handleCompleteSale()` called
5. ✅ Data prepared in `saleData` object
6. ✅ `savePharmacySale()` called
7. ✅ INSERT into `pharmacy_sales` → gets `sale_id`
8. ✅ INSERT into `pharmacy_sale_items` with `sale_id`
9. ✅ Success alert shows
10. ✅ Cart cleared

### Check Each Step:
```javascript
// In browser console, you should see:
console.log('Saving medication_type:', saleType)
console.log('✅ Sale saved successfully! Sale ID:', response.sale_id)
```

---

## ✅ Success Checklist

- [ ] No errors in browser console
- [ ] Alert shows "Sale completed successfully! Sale ID: X"
- [ ] Data visible in `pharmacy_sales` table (Supabase)
- [ ] Data visible in `pharmacy_sale_items` table (Supabase)
- [ ] `sale_id` matches between both tables
- [ ] `medication_id` exists in `medication` table
- [ ] Cart is cleared after sale

---

## 📝 Sample Test Query

Run this after completing a sale:

```sql
-- Get complete sale details with items
SELECT
    ps.sale_id,
    ps.patient_name,
    ps.total_amount,
    ps.payment_method,
    ps.created_at,
    psi.medication_name,
    psi.quantity,
    psi.unit_price,
    psi.total_price
FROM pharmacy_sales ps
LEFT JOIN pharmacy_sale_items psi ON ps.sale_id = psi.sale_id
WHERE ps.sale_id = 1;  -- Replace with your sale_id
```

**Expected Output:**
```
sale_id: 1
patient_name: Test Patient
total_amount: 109.00
payment_method: CASH
medication_name: Paracetamol 500mg
quantity: 2
unit_price: 50.00
total_price: 100.00
```

---

## 🎯 Quick Debug Commands

### 1. Check if tables exist:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pharmacy_sales', 'pharmacy_sale_items', 'medication');
```

### 2. Check table structure:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pharmacy_sales';
```

### 3. Count records:
```sql
SELECT
  (SELECT COUNT(*) FROM pharmacy_sales) as sales_count,
  (SELECT COUNT(*) FROM pharmacy_sale_items) as items_count,
  (SELECT COUNT(*) FROM medication) as medicines_count;
```

### 4. Latest sale:
```sql
SELECT * FROM pharmacy_sales ORDER BY created_at DESC LIMIT 1;
```

---

## 📞 Still Having Issues?

1. Check browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Verify `pharmacy-billing-service.ts` file exists
4. Verify migration was run successfully
5. Check RLS policies (if enabled)

---

**Last Updated**: 2025-10-07
**Status**: Integration Active ✅
