# How to Apply Database Migration for Advance Payments

## Problem
Advance payments are not showing in the Cash Book main table's Debit column.

## Solution
Apply the database migration to include advance payments in the Cash Book view.

---

## Method 1: Using Supabase Dashboard (Recommended - Easiest)

### Step 1: Open Migration File
1. Open this file in your code editor:
   ```
   D:\adamrit\adamrit_23oct2025\supabase\migrations\20251029000002_create_all_daily_transactions_view.sql
   ```

2. **Select ALL content** (Ctrl + A) and **Copy** (Ctrl + C)

### Step 2: Go to Supabase Dashboard
1. Open your browser
2. Go to: https://supabase.com/dashboard
3. Login to your account
4. Select your project (ayushman HMIS or whatever your project name is)

### Step 3: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click on **"New query"** button (top right)

### Step 4: Paste and Run
1. **Paste** the migration SQL (Ctrl + V)
2. Click the **"Run"** button (or press Ctrl + Enter)
3. Wait for the query to complete

### Step 5: Verify Success
You should see a success message like:
```
NOTICE: Cash Book daily transactions view created successfully!
NOTICE: View includes: OPD, Lab, Radiology, Pharmacy, Physiotherapy, Mandatory Services, Direct Sales, Advance Payments
```

---

## Method 2: Using Supabase CLI (For Advanced Users)

### Prerequisites
- Node.js installed
- Supabase CLI installed (will be installed automatically if not present)

### Steps

1. **Open Terminal/Command Prompt**
   - Press `Win + R`, type `cmd`, press Enter
   - Navigate to your project folder:
     ```bash
     cd D:\adamrit\adamrit_23oct2025
     ```

2. **Login to Supabase**
   ```bash
     npx supabase login
   ```
   - This will open your browser
   - Login with your Supabase account
   - Return to terminal

3. **Link Your Project**
   ```bash
   npx supabase link
   ```
   - It will ask for your project reference
   - You can find it in Supabase Dashboard → Settings → General → Reference ID
   - Enter the reference ID

4. **Push Migration**
   ```bash
   npx supabase db push
   ```
   - This will apply all pending migrations
   - Wait for completion

---

## What Will Happen After Migration?

### Before Migration:
```
Cash Book Table:
Date        Particulars           Debit
29/10/2025  Patient: raj         ₹3,713
                                 (only services)
```

### After Migration:
```
Cash Book Table:
Date        Particulars           Debit
29/10/2025  Patient: raj         ₹3,713
            └─ 5 services...

29/10/2025  Patient: raj         ₹500
            (Advance)
            └─ Advance Payment
```

**Total Debit: ₹4,213** (Services + Advance Payment)

---

## Verification Steps

After applying the migration:

1. **Refresh your browser** (F5) on the Cash Book page

2. **Check if advance payments appear** in the main table

3. **Click on "Advance Payment" filter** in the dropdown to see only advances

4. **Click on patient name** to open modal:
   - Services section should show ₹3,713
   - Payments section should show ₹500
   - Balance should show ₹3,213 (Due)

---

## Troubleshooting

### Error: "relation already exists"
- This means the view is already created
- Solution: The migration is already applied, just refresh your browser

### Error: "permission denied"
- You don't have permission to run SQL
- Solution: Make sure you're logged in as the project owner

### Error: "column does not exist"
- Some required table or column is missing
- Solution: Check if `advance_payment` table exists in your database

### Still not showing in Cash Book?
1. **Hard refresh** your browser: Ctrl + Shift + R
2. **Clear cache** and reload
3. **Check browser console** for any errors (F12 → Console tab)

---

## Need Help?

If you encounter any issues:
1. Take a screenshot of the error
2. Check the browser console for errors
3. Verify the migration ran successfully in Supabase Dashboard → Database → Migrations

---

## Summary

- ✓ Migration file is ready: `20251029000002_create_all_daily_transactions_view.sql`
- ✓ Code changes are complete
- ✓ Only database migration needs to be applied
- ✓ After migration: Advance payments will show in Cash Book Debit column

**Recommended:** Use Method 1 (Supabase Dashboard) - it's the easiest and most reliable!
