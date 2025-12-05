# Test Pharmacy Billing with Debug Logs

## 🎯 Purpose
Debug logging has been added to identify exactly where the error occurs.

---

## 📋 Steps to Test

### Step 1: Open Browser DevTools
1. Press `F12` or `Ctrl+Shift+I`
2. Go to **Console** tab
3. Click **Clear console** (trash icon)

### Step 2: Navigate to Pharmacy Billing
- Go to: `localhost:8080/pharmacy`
- Click on **Billing** tab

### Step 3: Fill the Form
```
Sale Type: Other
Patient ID: UHAY25F27002 (or any)
Visit ID: IH25F27004 (or any)
Patient Name: Diya (or any)
```

### Step 4: Add Medicine
- Search: "pa"
- Click on "Paracetamol"
- Should add to cart

### Step 5: Select Payment
- Click **CASH** button

### Step 6: Complete Sale
- Click **"Complete Sale - ₹11.20"**

### Step 7: Check Console Output

---

## ✅ Expected Console Logs

You should see logs in this order:

```
1. Saving medication_type: other

2. === PHARMACY SALE DEBUG START ===
   Cart items: [Array with medicines]
   Patient Info: {id: "...", name: "Diya"}
   Visit ID: "IH25F27004"
   Payment Method: "CASH"
   Totals: {subtotal: 10, totalDiscount: 0, totalTax: 1.20, totalAmount: 11.20}

3. Calling savePharmacySale with data: {Object}

4. === PHARMACY SAVE RESPONSE ===
   Response: {success: true, sale_id: 1, message: "..."}
   Success: true
   Sale ID: 1
   Error: undefined

5. ✅ Sale saved successfully! Sale ID: 1
```

---

## ❌ If There's an Error

### Error at Step 1 (Before save):
```
=== PHARMACY SALE DEBUG START ===
Cart items: []  ← PROBLEM: Cart is empty
```
**Fix**: Make sure medicine was added to cart

### Error at Step 3 (Service call):
```
❌ Error saving to pharmacy_sales: relation "pharmacy_sales" does not exist
```
**Fix**: Run `supabase_pharmacy_migration.sql` in Supabase

### Error at Step 4 (Response):
```
Response: {success: false, error: "..."}
Success: false
Error: "Failed to save sale: ..."
```
**Fix**: Check the exact error message, it will tell you what's wrong

---

## 🔍 Common Error Messages

### 1. "relation pharmacy_sales does not exist"
**Meaning**: Table not created yet
**Fix**:
```sql
-- Run in Supabase SQL Editor:
-- Copy content from: supabase_pharmacy_migration.sql
```

### 2. "No items in cart to save"
**Meaning**: Cart is empty
**Fix**: Add medicine to cart before clicking Complete Sale

### 3. "foreign key constraint fails"
**Meaning**: medicine_id doesn't exist in medication table
**Fix**:
```sql
-- Check medication table:
SELECT id, name FROM medication LIMIT 10;
-- Make sure cart medicine IDs match
```

### 4. "new row violates check constraint"
**Meaning**: payment_method value is invalid
**Fix**: Must be: CASH, CARD, UPI, or INSURANCE (exact spelling)

### 5. "Failed to get sale_id after insert"
**Meaning**: Insert succeeded but didn't return sale_id
**Fix**: Check table has SERIAL/BIGSERIAL for sale_id column

---

## 📸 What to Share

If error persists:

1. **Take screenshot** of console with all logs visible
2. **Copy console text**:
   - Right-click in console
   - "Save as..."
   - Share the .log file

3. **Check Network tab**:
   - DevTools → Network
   - Filter: "pharmacy"
   - Look for red (failed) requests
   - Click on it → Preview/Response tab
   - Take screenshot

---

## 🧪 Test Data

### Minimum Required:
```javascript
{
  patientInfo: {
    id: "123",
    name: "Test Patient"
  },
  visitId: "456",
  cart: [{
    medicine_id: "uuid-from-medication-table",
    medicine_name: "Paracetamol",
    quantity: 1,
    unit_price: 10
  }],
  paymentMethod: "CASH"
}
```

---

## ✅ Success Indicators

1. ✅ Console shows: "✅ Sale saved successfully! Sale ID: X"
2. ✅ Alert popup shows: "Sale completed successfully! Sale ID: X"
3. ✅ Cart is cleared
4. ✅ In Supabase:
```sql
SELECT * FROM pharmacy_sales ORDER BY created_at DESC LIMIT 1;
-- Should show the new sale

SELECT * FROM pharmacy_sale_items WHERE sale_id = X;
-- Should show the medicine items
```

---

## 🎯 Next Steps After Success

Once you see "Sale ID: 1" in console:

1. **Verify in Supabase**:
```sql
-- Check sale header
SELECT
  sale_id,
  patient_name,
  total_amount,
  payment_method,
  created_at
FROM pharmacy_sales
WHERE sale_id = 1;

-- Check sale items
SELECT
  sale_item_id,
  medication_name,
  quantity,
  unit_price,
  total_price
FROM pharmacy_sale_items
WHERE sale_id = 1;
```

2. **Test again** with different data
3. **Remove debug logs** (optional) once working

---

**Updated**: 2025-10-07
**Debug Mode**: Active ✅
