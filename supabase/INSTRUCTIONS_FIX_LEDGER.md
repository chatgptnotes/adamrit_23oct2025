# Instructions: Fix Missing ONLINE Transactions in Ledger

## Problem
ONLINE transactions from advance payment (31/10 and 01/11) are not showing in SARASWAT BANK ledger statement.

---

## Solution Steps

### Step 1: Run Diagnostic Script

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv
   - Click **SQL Editor** in the left sidebar

2. **Run Diagnostic**
   - Click **New Query**
   - Open file: `supabase/DIAGNOSTIC_LEDGER_ISSUE.sql`
   - Copy all content
   - Paste in SQL Editor
   - Click **Run**

3. **Review Results**
   Look at each CHECK output:
   - **CHECK 1**: Do columns exist? (Should show 2 rows)
   - **CHECK 2**: Are payments there? (Should show Rs 50 and Rs 10)
   - **CHECK 3**: Do vouchers exist? (If NULL = vouchers missing)
   - **CHECK 6**: Is trigger updated? (Should show ✓ for all)
   - **CHECK 7**: Missing vouchers count (Should be 0)

---

### Step 2: Apply the Fix

1. **In SQL Editor**
   - Click **New Query** (or clear previous)
   - Open file: `supabase/FIX_MISSING_ONLINE_TRANSACTIONS.sql`
   - Copy all content
   - Paste in SQL Editor
   - Click **Run**

2. **Watch the Output**
   - Should show:
     - "Updated X payment records with bank information"
     - "Created voucher REC-XXX for payment date..."
     - "Vouchers created: 2" (or more)
     - "✓ FIX APPLIED SUCCESSFULLY!"

3. **Check Verification Results**
   - Should show created vouchers at the bottom
   - Should show ledger statement result with transactions

---

### Step 3: Verify in Application

1. **Refresh Browser**
   - Press `Ctrl + F5` (hard refresh)

2. **Open Ledger Statement**
   - Go to: http://localhost:8080/ledger-statement

3. **Select Filters**
   - Account: **SARASWAT BANK**
   - From Date: **31-10-2025**
   - To Date: **01-11-2025**

4. **Expected Result**
   - Should show 2+ transactions
   - Payment Mode: ONLINE
   - Amounts: Rs 50, Rs 10, etc.

---

## Troubleshooting

### If CHECK 1 shows NO columns:
You need to add bank columns first.

Run this migration first:
- File: `supabase/migrations/20251031120000_add_bank_columns_to_payments.sql`

Then run the fix script again.

---

### If CHECK 6 shows "OLD VERSION":
The trigger needs to be updated.

Run this migration first:
- File: `supabase/migrations/20251101000000_fix_online_payment_voucher_routing.sql`

Then run the fix script again.

---

### If Fix Script shows "Vouchers created: 0":
Check the diagnostic output:
- Are ONLINE payments there? (CHECK 2)
- Is bank_account_name = 'SARASWAT BANK'? (CHECK 2)
- Do vouchers already exist? (CHECK 3)

If bank_account_name is NULL, STEP 1 in fix script should update it.

---

### If Still Not Working:
Check browser console (F12):
- Look for errors in Network tab
- Check if API call is being made
- Verify paymentModeFilter is set to 'ONLINE'

Check database logs:
- Look for any errors in trigger execution
- Verify voucher entries were created with correct account_id

---

## Quick Summary

```sql
-- 1. Diagnostic
\i supabase/DIAGNOSTIC_LEDGER_ISSUE.sql

-- 2. Fix
\i supabase/FIX_MISSING_ONLINE_TRANSACTIONS.sql

-- 3. Verify in browser
http://localhost:8080/ledger-statement
```

---

## Contact
If issue persists, check:
- Supabase logs for errors
- Browser console for errors
- Database constraints or permissions issues
