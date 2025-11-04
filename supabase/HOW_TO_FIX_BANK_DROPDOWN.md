# How to Fix Bank Dropdown - Add STATE BANK OF INDIA (DRM)

## Issue
The "Select Bank Account" dropdown in the Advance Payment modal is only showing **SARASWAT BANK**, but it should show both:
- SARASWAT BANK
- STATE BANK OF INDIA ( DRM )

## Root Cause
The database migration to add these bank accounts hasn't been applied yet, or one of the banks is marked as inactive.

## Solution - Run the Verification Script

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** (in the left sidebar)

2. **Run the Verification Script**
   - Click "New Query"
   - Copy the contents of `VERIFY_AND_FIX_BANKS.sql`
   - Paste into the SQL editor
   - Click "Run" button

3. **Check the Output**
   - The script will show you:
     - Current status of bank accounts (STEP 1)
     - Add/Update STATE BANK OF INDIA (DRM) (STEP 2)
     - Add/Update SARASWAT BANK (STEP 3)
     - Final verification showing both banks are active (STEP 4)
   - Look for the ✅ SUCCESS message

4. **Refresh Your Application**
   - Go back to your application (localhost:8080)
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
   - Open the Final Bill page
   - Click "Advance Payment" button
   - Select "Online Transfer" as payment mode
   - You should now see both banks in the dropdown!

### Option 2: Using psql Command Line

If you have direct database access:

```bash
# Connect to your database
psql <your-connection-string>

# Run the script
\i supabase/VERIFY_AND_FIX_BANKS.sql
```

### Option 3: Using Supabase CLI

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link to your project (if not already linked)
supabase link --project-ref <your-project-ref>

# Run the SQL file
supabase db execute < supabase/VERIFY_AND_FIX_BANKS.sql
```

## What the Script Does

1. **Checks** if the banks already exist in the database
2. **Inserts or Updates** both bank accounts:
   - STATE BANK OF INDIA (DRM) with account code 1121
   - SARASWAT BANK with account code 1122
3. **Forces** both banks to be active (`is_active = true`)
4. **Verifies** that both banks are now in the database and active

## Alternative: Run the Original Migration

If you prefer to run the original migration file:

```bash
# Using Supabase SQL Editor - paste and run this file:
supabase/migrations/20251031000001_add_bank_accounts.sql
```

## Troubleshooting

### Still only seeing one bank?

1. **Check browser console logs**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for messages like:
     - `✅ Fetched bank accounts from database:`
     - `⚠️ Using fallback hardcoded banks`
   - This will tell you if the database query is working

2. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache completely

3. **Verify database connection**
   - Make sure your application can connect to Supabase
   - Check if other database queries are working

4. **Check Supabase logs**
   - Go to Supabase Dashboard → Logs
   - Look for any errors related to `chart_of_accounts` table

### The dropdown is still not showing?

Make sure:
1. **Payment Mode is set to "Online Transfer"**
   - The bank dropdown only appears when payment mode = "Online Transfer"
   - If you select "CASH", the bank dropdown won't show

2. **Modal is fully loaded**
   - Wait a few seconds after opening the modal
   - The banks are fetched asynchronously when the modal opens

## Code Verification

The code already supports both banks correctly:

**File:** `src/components/AdvancePaymentModal.tsx`

- **Lines 184**: Database query includes both banks
- **Lines 191-223**: Fallback list includes both banks
- **Lines 944-948**: Dropdown renders all banks without filtering

So the issue is definitely in the database, not the code!

## Success Criteria

After running the fix script, you should see:

✅ **Advance Payment Modal → Payment Mode: Online Transfer → Select Bank Account**
- SARASWAT BANK
- STATE BANK OF INDIA ( DRM )

Both options should be visible in the dropdown!
