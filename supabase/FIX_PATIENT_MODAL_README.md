# Fix Patient Details Modal - Step by Step Guide

## Problem Summary

The Patient Details Modal was showing "Patient UID: Not assigned" because the database query was **failing silently** due to missing/incorrect foreign key relationships.

**Error from console:**
```
Could not find a relationship between 'visit_medications' and 'medications' in the schema cache
```

## Root Cause

1. **Table name inconsistency:** Both `medication` (singular) and `medications` (plural) tables may exist
2. **Wrong foreign key:** `visit_medications` was pointing to `medication` instead of `medications`
3. **Improperly named FKs:** Foreign keys weren't named properly for PostgREST auto-detection

## Solution

I've created 2 SQL files to fix this issue:

### 1. `DIAGNOSE_SCHEMA_RELATIONSHIPS.sql`
   - **Purpose:** Check current database state
   - **What it does:** Shows which tables exist, what foreign keys are configured
   - **When to use:** Run this FIRST to see what's wrong

### 2. `migrations/20251103000003_fix_medications_schema_relationships.sql`
   - **Purpose:** Fix all schema issues
   - **What it does:**
     - Standardizes on `medications` (plural) table
     - Migrates data from old `medication` table if it exists
     - Recreates `visit_medications` with correct foreign keys
     - Ensures `visit_diagnoses` has proper foreign keys
     - Drops old `medication` (singular) table
     - Creates proper indexes and RLS policies

---

## Step-by-Step Instructions

### Step 1: Run Diagnostic Query (Optional but Recommended)

Open your Supabase SQL Editor and run:
```
D:\adamrit\adamrit_23oct2025\supabase\DIAGNOSE_SCHEMA_RELATIONSHIPS.sql
```

**Expected Output:**
- Shows which medication table(s) exist
- Shows current foreign key configuration
- Identifies issues

**Take a screenshot** if you want to see the "before" state.

---

### Step 2: Apply the Fix Migration

Run this file in Supabase SQL Editor:
```
D:\adamrit\adamrit_23oct2025\supabase\migrations\20251103000003_fix_medications_schema_relationships.sql
```

**What will happen:**
1. Creates `medications` table (plural) with all required columns
2. Migrates any existing data from old `medication` table
3. Drops and recreates `visit_medications` with correct foreign keys:
   - `visit_medications_visit_id_fkey` → `visits(id)`
   - `visit_medications_medication_id_fkey` → `medications(id)`
4. Ensures `visit_diagnoses` has proper foreign keys
5. Removes old `medication` (singular) table
6. Sets up RLS policies and permissions

**Look for this success message:**
```
✓ Schema Fix Migration Completed!
Medications Table Status:
  - Old "medication" (singular): ✓ Removed
  - New "medications" (plural): ✓ Exists
Foreign Keys:
  - visit_medications FKs: 2 (should be 2)
  - visit_diagnoses FKs: 2 (should be 2)
PatientDetailsModal should now work correctly!
```

---

### Step 3: Test the Patient Details Modal

1. **Refresh your browser** (clear cache if needed)
2. **Open the Ledger Statement** page
3. **Click the eye icon** (👁️) for the ABC patient
4. **Verify the modal shows:**
   - Patient name: ABC
   - Patient UID: UHA25118001 (not "Not assigned")
   - All diagnoses
   - All surgeries
   - All medications
   - All lab test results

---

### Step 4: Verify with Console Logs

The debug console logs should now show:
```
✅ Patient data fetched: {
  name: 'ABC',
  patients_id: 'UHA25118001',
  id: '541040d7-d1e5-4a87-886d-c2a735063bd8'
}
```

And **NO ERRORS** about missing relationships!

---

## If Issues Persist

If the modal still doesn't work after applying the migration:

1. **Check the browser console** for any new errors
2. **Run the diagnostic SQL again** to verify foreign keys were created
3. **Check if migration was applied:**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   WHERE version = '20251103000003';
   ```
4. **Share the console logs** with me

---

## Files Created

1. ✅ `supabase/DIAGNOSE_SCHEMA_RELATIONSHIPS.sql` - Diagnostic query
2. ✅ `supabase/migrations/20251103000003_fix_medications_schema_relationships.sql` - Fix migration
3. ✅ This README file

---

## Next Steps After Testing

Once the modal works:
- We'll remove the debug console.log statements
- Clean up the code
- You're done! 🎉
