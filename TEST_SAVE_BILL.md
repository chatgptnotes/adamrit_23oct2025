# Test Physiotherapy Bill Save Function

## Quick Test Procedure

### Step 1: Open the Page
- Go to: `http://localhost:5173/physiotherapy-bill/IH25J03001`
- (Or whatever your visit ID is)

### Step 2: Open Browser Console
- Press **F12** on your keyboard
- Click on **"Console"** tab
- Keep this open

### Step 3: Fill in the Bill
- Item 1: hgfghc, code 8987, rate 40, qty 30
- Item 2: tytfyf, code 7778, rate 80, qty 40
- Verify total shows: 4400.00

### Step 4: Click "Save Bill"
- Click the blue "Save Bill" button
- Watch the console

### Step 5: Check Console Output

**✅ SUCCESS - You should see:**
```
Saving bill data: {billNo: "OH2503001", totalAmount: 4400, ...}
Bill summary saved to visits table successfully
Old items deleted successfully
Inserting items: [...]
Items saved successfully
```
**Plus a green toast notification: "Bill saved successfully!"**

**❌ ERROR - If you see:**
```
Error saving to visits table: {...}
```
**→ Copy the error and check below**

---

## Common Errors and Fixes

### Error: "new row violates row-level security policy"
**Fix:** RLS is blocking the update. Run this in Supabase SQL Editor:
```sql
CREATE POLICY "Allow authenticated users to update visits"
ON visits FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

### Error: "column 'physiotherapy_bill_number' does not exist"
**Fix:** Migration not applied. Go to Supabase and run:
`RUN_THIS_IN_SUPABASE.sql`

### Error: "permission denied for table visits"
**Fix:** User doesn't have permissions. Check authentication.

---

## Step 6: Verify in Supabase

1. Go to Supabase → Table Editor → visits
2. Find the row where visit_id = "IH25J03001" (or your visit ID)
3. Scroll right to see physiotherapy columns
4. Should see:
   - physiotherapy_bill_number: "OH2503001"
   - physiotherapy_bill_total: 4400.00
   - physiotherapy_bill_date_from: 2025-10-03
   - physiotherapy_bill_date_to: 2025-10-04

5. Go to physiotherapy_bill_items table
6. Filter by visit_id
7. Should see 2 rows with hgfghc and tytfyf

---

## Step 7: Test Persistence

1. **Refresh the page** (press F5)
2. **Check console** - should see:
```
Loaded bill data from visits table: {billNumber: "OH2503001", hasSavedBillNumber: true, ...}
Fetched items from database: [{item_name: "hgfghc", ...}, ...]
```
3. **Verify the bill** - should show:
   - Bill number: OH2503001
   - Items: hgfghc and tytfyf with all data
   - Total: 4400.00

---

## If Nothing Works

1. Copy ALL console output
2. Check if visit_id is correct (should match URL parameter)
3. Verify you're logged in (check for auth token)
4. Try logging out and back in
5. Clear browser cache and try again

---

## Success Criteria

✅ Click "Save Bill" → See success message
✅ Console shows successful save logs
✅ Data appears in Supabase tables
✅ Refresh page → Data persists
✅ All items load correctly

When all these work, the feature is complete!
