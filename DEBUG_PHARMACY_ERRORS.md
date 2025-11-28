# Debug Pharmacy Billing Errors

## 🔍 Console Errors Visible in Screenshot

Based on the screenshot, I can see these messages:

1. **AUTH_DEBUG warnings** (multiple times):
   - `user?.hospitalType = undefined`
   - `user = null`
   - `hospitalConfig =`

2. **Application logs**:
   - "Counting patients for hospital: home"
   - "Saving medication_type: other"

**Note**: These AUTH warnings are not blocking errors - they're debug messages.

---

## 🐛 Possible Issues & Solutions

### Issue 1: pharmacy_sales table doesn't exist
**Symptoms**: Error like "relation pharmacy_sales does not exist"

**Solution**: Run migration in Supabase SQL Editor
```sql
-- File: supabase_pharmacy_migration.sql
-- Copy entire content and run in Supabase
```

**Verify**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('pharmacy_sales', 'pharmacy_sale_items');
```

---

### Issue 2: CartItem interface mismatch
**Symptoms**: TypeScript errors or runtime errors about missing properties

**Solution**: Check CartItem in PharmacyBilling.tsx matches service expectations

**Current Expected Fields**:
```typescript
{
  medicine_id: string;        // UUID
  medicine_name: string;
  medication_name?: string;   // Note: service expects 'medication_name'
  generic_name?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  dosage_form?: string;
  strength?: string;
}
```

---

### Issue 3: medication_id type mismatch
**Symptoms**: Foreign key constraint error

**Check**: Is `medicine_id` in cart a valid UUID from medication table?

**Debug**:
```javascript
// Add this in handleCompleteSale before savePharmacySale
console.log('Cart items:', cart);
console.log('Medicine IDs:', cart.map(item => item.medicine_id));
```

**Verify in Supabase**:
```sql
SELECT id, name FROM medication LIMIT 5;
-- Check if IDs match what's in cart
```

---

### Issue 4: Field name confusion (medication_name vs medicine_name)
**Problem**: Cart has `medicine_name` but service maps to `medication_name`

**Fix in PharmacyBilling.tsx** (line 488):
```typescript
// Current (correct):
medication_name: item.medicine_name,

// Make sure CartItem interface has:
interface CartItem {
  medicine_id: string;  // ✅
  medicine_name: string; // ✅
  // NOT: medication_name
}
```

---

### Issue 5: RLS (Row Level Security) blocking inserts
**Symptoms**: "new row violates row-level security policy"

**Check in Supabase**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('pharmacy_sales', 'pharmacy_sale_items');
```

**Temporary Fix** (disable RLS for testing):
```sql
ALTER TABLE pharmacy_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_sale_items DISABLE ROW LEVEL SECURITY;
```

**Proper Fix** (create policy):
```sql
-- Already in migration, but verify:
CREATE POLICY "Enable insert for authenticated users"
ON pharmacy_sales FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

---

## 🧪 Step-by-Step Debug

### Step 1: Add Debug Logging

**In PharmacyBilling.tsx**, before line 510 (`const response = await savePharmacySale...`):

```typescript
// Add extensive logging
console.log('=== PHARMACY SALE DEBUG ===');
console.log('Cart:', cart);
console.log('Patient Info:', patientInfo);
console.log('Totals:', totals);
console.log('Sale Data to send:', {
  sale_type: saleType,
  patient_id: patientInfo.id,
  visit_id: visitId,
  payment_method: paymentMethod,
  items: cart.length
});

cart.forEach((item, index) => {
  console.log(`Cart Item ${index}:`, {
    medicine_id: item.medicine_id,
    medicine_name: item.medicine_name,
    quantity: item.quantity,
    unit_price: item.unit_price
  });
});
```

### Step 2: Check Service Response

**After line 510**, add:

```typescript
const response = await savePharmacySale(saleData);

console.log('=== SERVICE RESPONSE ===');
console.log('Success:', response.success);
console.log('Sale ID:', response.sale_id);
console.log('Error:', response.error);
console.log('Message:', response.message);
```

### Step 3: Run Test Sale

1. Open browser DevTools → Console tab
2. Clear console
3. Fill pharmacy form
4. Add medicine to cart
5. Click "Complete Sale"
6. **Take screenshot of console output**

---

## 🔍 Common Error Messages & Fixes

### Error: "Cannot read property 'medicine_id' of undefined"
**Fix**: Cart is empty or items missing `medicine_id`
```typescript
// Check cart before saving:
if (!cart || cart.length === 0) {
  alert('Cart is empty!');
  return;
}
```

### Error: "Failed to save sale: new row violates check constraint"
**Fix**: payment_method must be: CASH, CARD, UPI, or INSURANCE
```typescript
// Verify payment method:
console.log('Payment Method:', paymentMethod);
// Should be one of: 'CASH', 'CARD', 'UPI', 'INSURANCE'
```

### Error: "foreign key constraint fails"
**Fix**: medication_id doesn't exist in medication table
```sql
-- Check if medicine exists:
SELECT id, name FROM medication
WHERE id = 'uuid-from-cart';
```

### Error: "Failed to get sale_id after insert"
**Fix**: Check if .select('sale_id').single() is working
```typescript
// In pharmacy-billing-service.ts, add logging:
console.log('Sale header response:', saleHeader);
```

---

## 🎯 Quick Checklist

Before testing, verify:

- [ ] `supabase_pharmacy_migration.sql` was run successfully
- [ ] Tables `pharmacy_sales` and `pharmacy_sale_items` exist
- [ ] Table `medication` has sample data with valid UUIDs
- [ ] File `src/lib/pharmacy-billing-service.ts` exists
- [ ] Import in PharmacyBilling.tsx is correct
- [ ] Browser console is open (DevTools)
- [ ] Network tab in DevTools is recording
- [ ] User is authenticated (logged in)

---

## 📊 Expected Console Output (Success)

```
Saving medication_type: other
=== PHARMACY SALE DEBUG ===
Cart: [Object]
Patient Info: {id: "123", name: "Test Patient"}
Totals: {subtotal: 100, totalDiscount: 0, totalTax: 9, totalAmount: 109}
Sale Data to send: {sale_type: "other", patient_id: 123, ...}
Cart Item 0: {medicine_id: "uuid", medicine_name: "Paracetamol", ...}

=== SERVICE RESPONSE ===
Success: true
Sale ID: 1
Error: undefined
Message: "Sale saved successfully"

✅ Sale saved successfully! Sale ID: 1
```

---

## 🆘 If Still Not Working

1. **Export console logs**:
   - Right-click in console → Save as...
   - Send me the log file

2. **Check Network tab**:
   - Filter by "pharmacy_sales"
   - Check request payload
   - Check response

3. **Check Supabase logs**:
   - Supabase Dashboard → Logs
   - Look for INSERT errors

4. **Verify table structure**:
```sql
\d pharmacy_sales
\d pharmacy_sale_items
```

---

**Created**: 2025-10-07
**For**: Debugging pharmacy billing save issues
