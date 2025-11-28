# Physiotherapy Bill Data Persistence - Debug Guide

## Issue
Data entered in physiotherapy bill (items, dates, bill number) is not persisting after page refresh.

## Step-by-Step Debugging Process

### Step 1: Verify Database Migration Was Applied

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard
   - Select your project
   - Go to SQL Editor

2. **Run this query to check if columns exist:**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'visits'
   AND column_name LIKE 'physiotherapy%';
   ```

3. **Expected Result:**
   Should show these columns:
   - `physiotherapy_bill_number` (text)
   - `physiotherapy_bill_total` (numeric)
   - `physiotherapy_bill_date_from` (date)
   - `physiotherapy_bill_date_to` (date)
   - `physiotherapy_bill_generated_at` (timestamp with time zone)

4. **If columns are missing:**
   Run the migration SQL from:
   `supabase/migrations/20251004000000_add_physiotherapy_bill_to_visits.sql`

---

### Step 2: Check Browser Console for Errors

1. **Open browser console:**
   - Press `F12` or `Ctrl+Shift+I`
   - Go to "Console" tab

2. **Fill in bill data and click "Save Bill"**

3. **Look for these log messages:**
   ```
   ✅ "Saving bill data: { billNo: ..., totalAmount: ..., itemsCount: ... }"
   ✅ "Bill summary saved to visits table successfully"
   ✅ "Old items deleted successfully"
   ✅ "Inserting items: [...]"
   ✅ "Items saved successfully"
   ```

4. **Common Errors:**
   - **RLS Policy Error:** "new row violates row-level security policy"
     - Fix: Check RLS policies on visits table
   - **Column doesn't exist:** "column 'physiotherapy_bill_number' does not exist"
     - Fix: Run the migration SQL
   - **Permission denied:** "permission denied for table visits"
     - Fix: Check user permissions

---

### Step 3: Verify Data in Supabase Tables

1. **Check visits table:**
   - Go to Supabase → Table Editor → visits
   - Find the row with your visit_id (e.g., visit_id for OH2503001)
   - Check if these columns have data:
     - physiotherapy_bill_number: "OH2503001"
     - physiotherapy_bill_total: 9600.00
     - physiotherapy_bill_date_from: "2025-10-03"
     - physiotherapy_bill_date_to: "2025-10-04"

2. **Check physiotherapy_bill_items table:**
   - Go to Table Editor → physiotherapy_bill_items
   - Filter by visit_id
   - Should see 2 rows:
     - SS (code: 1212, rate: 30, qty: 80, amount: 2400.00)
     - 3R2 (code: 2113, rate: 80, qty: 90, amount: 7200.00)

---

### Step 4: Check RLS Policies

1. **Go to Supabase → Authentication → Policies**

2. **Check visits table policies:**
   - Should have UPDATE policy that allows authenticated users to update
   - Common policy:
     ```sql
     CREATE POLICY "Users can update visits"
     ON visits FOR UPDATE
     USING (auth.uid() IS NOT NULL)
     WITH CHECK (auth.uid() IS NOT NULL);
     ```

3. **Check physiotherapy_bill_items table policies:**
   - Should have INSERT and DELETE policies
   - Should allow authenticated users

---

### Step 5: Test the Complete Flow

1. **Clear browser cache and refresh**
2. **Fill in bill:**
   - Add items (SS, 3R2, etc.)
   - Set date range
3. **Click "Save Bill"**
4. **Check console - should see success messages**
5. **Refresh page (F5)**
6. **Data should reappear**

---

## Quick Fix Commands

### If Migration Not Applied:
```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_number TEXT,
ADD COLUMN IF NOT EXISTS physiotherapy_bill_total NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS physiotherapy_bill_date_from DATE,
ADD COLUMN IF NOT EXISTS physiotherapy_bill_date_to DATE,
ADD COLUMN IF NOT EXISTS physiotherapy_bill_generated_at TIMESTAMP WITH TIME ZONE;
```

### If RLS Blocking Updates:
```sql
-- Allow updates to visits table
CREATE POLICY "Allow authenticated users to update visits"
ON visits FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow inserts to physiotherapy_bill_items
CREATE POLICY "Allow authenticated users to insert bill items"
ON physiotherapy_bill_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow deletes from physiotherapy_bill_items
CREATE POLICY "Allow authenticated users to delete bill items"
ON physiotherapy_bill_items FOR DELETE
TO authenticated
USING (true);
```

---

## Contact Points

If issues persist:
1. Check console.log output from the code
2. Verify network tab in DevTools shows successful API calls
3. Check Supabase logs for errors
4. Verify user is authenticated (check auth token)

---

## Files Modified

- `src/pages/PhysiotherapyBill.tsx` - Added save/fetch logic
- `supabase/migrations/20251004000000_add_physiotherapy_bill_to_visits.sql` - Migration file

---

## Expected Behavior

**After Fix:**
1. Enter bill data → Click "Save Bill" → See success toast
2. Refresh page → All data reappears (items, dates, bill number)
3. Console shows successful save and fetch logs
4. Supabase tables contain the data
