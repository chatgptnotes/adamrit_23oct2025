# Complete Fix: Lab Panel Formula Error

## Problem
When editing values in the lab panel form, you encountered this error:
```
Error updating panel: Unknown error
Could not find the 'formula' column of 'lab_test_config' in the schema cache
PGRST204
```

## Root Cause
The application code was trying to INSERT three columns (`formula`, `test_type`, `text_value`) into the `lab_test_config` table, but these columns don't exist in that table. These fields should be stored in the separate `lab_test_formulas` table instead.

## Solution Applied

### ✅ Code Changes Made

#### 1. **LabPanelManager.tsx** - saveSubTestsToDatabase function (Lines 900-960)
- **Removed** `formula`, `test_type`, and `text_value` from the `lab_test_config` insert
- **Added** separate logic to save these fields to `lab_test_formulas` table using `upsert`
- Formulas are now saved with proper conflict resolution on `(lab_id, test_name, sub_test_name)`

#### 2. **LabPanelManager.tsx** - loadSubTestsFromDatabase function (Lines 694-752)
- **Added** query to load formulas from `lab_test_formulas` table
- **Created** a Map to efficiently lookup formulas by sub_test_name
- **Updated** sub-test creation to use formula data from the formulas table instead of lab_test_config

#### 3. **LabPanelManager.tsx** - loadSubTestsFromDatabaseInForm function (Lines 2143-2198)
- **Added** same formula loading logic as above
- Ensures Edit Panel Form loads formulas correctly

#### 4. **LabOrders.tsx** - fetchSubTestsForTest function (Lines 681-768)
- **Added** query to load formulas from `lab_test_formulas` table
- **Updated** to use formulas from the separate table when creating sub-test objects
- Formula calculations now work correctly in lab orders

## How It Works Now

### When SAVING a panel:
1. Main test configuration (age ranges, normal ranges, etc.) → `lab_test_config` table
2. Formula, test type, and text value → `lab_test_formulas` table
3. Uses `upsert` to update existing formulas or create new ones

### When LOADING a panel:
1. Fetch all test configurations from `lab_test_config`
2. Fetch formulas from `lab_test_formulas` in parallel
3. Create a Map to match formulas to their sub-tests
4. Combine the data when creating SubTest objects

## Files Modified

1. **src/components/lab/LabPanelManager.tsx**
   - Line 900-960: Modified save logic
   - Line 694-752: Modified load logic (main function)
   - Line 2143-2198: Modified load logic (form function)

2. **src/components/lab/LabOrders.tsx**
   - Line 681-768: Modified fetch logic to use lab_test_formulas

## Database Structure

### lab_test_config table
- Stores: test configurations, age ranges, normal ranges, units
- Does NOT store: formulas, test_type, text_value

### lab_test_formulas table
- Stores: formulas, test_type (Numeric/Text), text_value
- Unique constraint on: (lab_id, test_name, sub_test_name)
- Related to lab_test_config via: (lab_id, test_name, sub_test_name)

## Testing the Fix

1. **Refresh your browser** (Ctrl + Shift + R) to clear cache
2. **Navigate** to the Lab Panel page
3. **Edit** an existing panel
4. **Add or modify** a formula for a sub-test
5. **Save** the panel
6. **Verify** no errors in console
7. **Reload** the panel to confirm formula was saved

### Expected Result
- ✅ No "Could not find the 'formula' column" error
- ✅ Panel saves successfully
- ✅ Formulas are persisted in lab_test_formulas table
- ✅ Edit panel form loads formulas correctly
- ✅ Lab orders show correct formula data

## Troubleshooting

### If error persists:
1. Hard refresh: `Ctrl + Shift + R`
2. Check browser console for new errors
3. Verify `lab_test_formulas` table exists in Supabase
4. Check Network tab → verify POST/PUT requests succeed

### To verify table exists:
Run in Supabase SQL Editor:
```sql
SELECT * FROM information_schema.tables
WHERE table_name = 'lab_test_formulas';
```

### To check if formulas are saving:
```sql
SELECT * FROM lab_test_formulas
ORDER BY created_at DESC
LIMIT 10;
```

## Additional Notes

- The fix maintains **backward compatibility** with existing data
- Formulas are **optional** - if formula save fails, the main data still saves
- The code uses **upsert** to handle both new formulas and updates to existing ones
- All three locations (save, load, fetch) now use the same pattern consistently

## Summary

The error is now fixed! The application properly separates concerns:
- **lab_test_config**: Core test configuration
- **lab_test_formulas**: Formula calculations and test types

This prevents schema cache issues and follows proper database normalization.
