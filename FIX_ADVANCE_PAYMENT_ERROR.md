# Fix: Advance Payment Save Error

## Error You're Getting
```
Failed to save advance payment: TypeError: Failed to fetch
```

This happens when trying to save an ONLINE payment to SARASWAT BANK.

---

## Why This Is Happening

The trigger `create_receipt_voucher_for_payment()` is now running for ONLINE payments (which we enabled). But it's failing silently, causing the save to fail.

**Most likely causes:**
1. Trigger can't find bank account in chart_of_accounts
2. Voucher type/number generation failing
3. Some constraint violation

---

## Quick Fix: Check What's Failing

### Step 1: Open Browser Console
1. Press **F12**
2. Go to **Console** tab
3. Try saving payment again
4. Look for red error messages
5. **Screenshot the error and share it!**

### Step 2: Check Supabase Logs
1. Go to: https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv/logs
2. Click on "Postgres Logs"
3. Look for errors around the time you tried to save
4. **Share the error message!**

---

## Temporary Solution: Disable Trigger

If you need to save payments urgently, temporarily disable the trigger:

```sql
-- Run this in Supabase SQL Editor
DROP TRIGGER IF EXISTS trg_advance_payment_create_voucher ON advance_payment;
```

This will let you save payments BUT vouchers won't be created automatically.

**To re-enable later:**
```sql
CREATE TRIGGER trg_advance_payment_create_voucher
  AFTER INSERT ON advance_payment
  FOR EACH ROW
  EXECUTE FUNCTION create_receipt_voucher_for_payment();
```

---

## Permanent Fix Needed

I need to see the actual error to fix it properly. Most likely I need to:

1. Make trigger more resilient (don't fail if bank account missing)
2. Add better error logging
3. Handle NULL bank_account_id gracefully

**Share the error from browser console or Supabase logs!**

---

## What To Share

To help you fix this, I need:

1. ✅ Browser console error (F12 → Console tab)
2. ✅ Supabase Postgres logs error
3. ✅ Confirm: Can you save CASH payments? (test with payment mode = CASH)

This will tell me exactly what's breaking in the trigger.
