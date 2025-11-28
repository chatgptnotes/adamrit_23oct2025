# Troubleshooting: Ledger Still Showing Error

## Current Error
```
Error loading ledger data: Could not find the function public.get_ledger_statement_with_patients(p_account_name, p_from_date, p_mrn_filter, p_to_date) in the schema cache
```

## Problem
You ran both migrations BUT the function still doesn't exist in database.

---

## Step 1: Run Diagnostic Check 🔍

This will tell us EXACTLY what's missing in your database.

### How to Run:

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv/sql
2. Click "New Query"
3. Open file: `supabase/migrations/DIAGNOSTIC_CHECK.sql`
4. Copy **entire content** (Ctrl+A, Ctrl+C)
5. Paste in SQL Editor
6. Click **"Run"** button

### What to Look For:

The output will show you:

```
✓ SUCCESS: Function get_ledger_statement_with_patients EXISTS
or
✗ MISSING: Function get_ledger_statement_with_patients NOT FOUND
```

**Take a screenshot of the ENTIRE output and share it!**

---

## Step 2: Based on Diagnostic Results

### If Functions are MISSING (✗):

The migrations didn't run properly. Let's re-run with fresh database state.

**Action:**
1. Close all browser tabs
2. Open new Supabase SQL Editor tab
3. Re-run the main migration: `20251101000000_fix_online_payment_voucher_routing.sql`
4. Look for **any red error messages**
5. Share screenshot if errors appear

### If Functions EXIST (✓) but frontend still shows error:

This is a **browser cache issue**.

**Action:**
1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Check "Disable cache" checkbox
4. Hard refresh page (Ctrl+Shift+R)
5. Try searching in ledger again

---

## Step 3: Common Issues & Fixes

### Issue 1: "relation voucher_types does not exist"

**Meaning:** Your database doesn't have accounting tables set up.

**Fix:** Run this migration first:
```
supabase/migrations/20250612230000_create_accounting_tables.sql
```

Then run our fix migrations.

### Issue 2: "schema cache" error persists

**Meaning:** Supabase backend needs restart or cache clear.

**Fix:**
1. Go to Supabase Dashboard → Settings
2. Click "Restart Database" (if available)
3. Wait 2 minutes
4. Try again

### Issue 3: Migrations run but no output/errors

**Meaning:** Silent failure - check Supabase logs.

**Fix:**
1. Go to Supabase Dashboard → Logs
2. Filter by "Database" logs
3. Look for errors around the time you ran migration
4. Share the error logs

---

## Step 4: Nuclear Option (If Nothing Works)

If diagnostic shows functions exist BUT frontend still errors:

### Check Environment Variables

1. Open `.env` file
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Make sure they match your Supabase project

### Restart Frontend

```bash
# Stop the dev server (Ctrl+C)
# Clear node_modules cache
npm run dev
```

### Check Supabase Client

Open browser console (F12) and run:
```javascript
// Check if Supabase is connected
const { data, error } = await window.supabase.rpc('get_ledger_statement_with_patients', {
  p_account_name: 'SARASWAT BANK',
  p_from_date: '2025-10-27',
  p_to_date: '2025-11-01',
  p_mrn_filter: null
});

console.log('Data:', data);
console.log('Error:', error);
```

---

## What I Need From You

To help you further, please share:

1. ✅ Screenshot of **DIAGNOSTIC_CHECK.sql** output (FULL output)
2. ✅ Screenshot of any **error messages** when running migrations
3. ✅ Browser console errors (F12 → Console tab)
4. ✅ Which browser you're using

---

## Quick Checklist

Before asking for help, make sure:

- [ ] Ran `DIAGNOSTIC_CHECK.sql` and checked output
- [ ] Tried hard refresh (Ctrl+Shift+R)
- [ ] Cleared browser cache
- [ ] Checked Supabase logs for errors
- [ ] Verified database is not paused/sleeping
- [ ] Confirmed using correct Supabase project

---

## Most Likely Causes (Ranked)

1. **Browser Cache (70%)** - Old error cached, function exists
2. **Migration Failed Silently (20%)** - Check diagnostic output
3. **Wrong Database/Project (5%)** - Check .env file
4. **Supabase Backend Issue (5%)** - Restart database

---

**Start with Step 1: Run the diagnostic check!**

That will tell us exactly what's wrong. 🔍
