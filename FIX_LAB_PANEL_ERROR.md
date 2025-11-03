# Fix: Lab Panel Edit Form Error

## Problem
When editing values in the lab panel form, you encounter the error:
```
Error updating panel: Unknown error
Could not find the 'formula' column of 'lab_test_config'
```

## Root Cause
The application code (LabPanelManager.tsx) tries to save three columns to the `lab_test_config` table that don't exist:
- `formula` - for storing calculation formulas
- `test_type` - for distinguishing between Numeric and Text tests
- `text_value` - for storing default text values

## Solution

### Step 1: Apply Database Migration

1. Open your **Supabase Dashboard** (https://app.supabase.com)
2. Navigate to your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `ADD_FORMULA_COLUMNS_FIX.sql`
6. Click **Run** or press `Ctrl + Enter`

The SQL file will:
- Add the three missing columns
- Set appropriate defaults and constraints
- Update existing rows
- Verify the changes

### Step 2: Verify the Fix

After running the SQL:

1. Check the query results at the bottom - you should see three rows showing the new columns:
   - `formula` (text, nullable)
   - `test_type` (text, nullable, default: 'Numeric')
   - `text_value` (text, nullable)

2. Refresh your application (`localhost:8080/lab`)

3. Try editing a panel again - the error should be gone!

### Step 3: Test the New Features

The fix enables these features:
- **Formula-based calculations**: Sub-tests can now have formulas that auto-calculate based on other sub-test values
- **Text type tests**: You can create tests with text values instead of numeric ranges
- **Type distinction**: Tests can be marked as either 'Numeric' or 'Text'

## Files Created/Modified

### New Files
- `ADD_FORMULA_COLUMNS_FIX.sql` - SQL script to run in Supabase
- `supabase/migrations/20251103000000_add_formula_columns_to_lab_test_config.sql` - Migration file for version control
- `FIX_LAB_PANEL_ERROR.md` - This documentation

### Code Reference
The issue was in these files:
- `src/components/lab/LabPanelManager.tsx:906` - Trying to save formula column
- `src/components/lab/LabPanelManager.tsx:904` - Trying to save test_type column
- `src/components/lab/LabPanelManager.tsx:905` - Trying to save text_value column
- `src/components/lab/LabPanelManager.tsx:2152` - Trying to read formula column

## Troubleshooting

### If the error persists after applying the fix:

1. **Clear browser cache**: Hard refresh (`Ctrl + Shift + R`)
2. **Check Supabase logs**: Go to Database → Logs to see any SQL errors
3. **Verify columns exist**: Run this query in SQL Editor:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'lab_test_config';
   ```
4. **Check RLS policies**: Ensure your Row Level Security policies allow INSERT/UPDATE with the new columns

### If you see "permission denied":
Your RLS policies might need updating. Run:
```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'lab_test_config';
```

## Need More Help?
If you continue to experience issues, check:
- Browser console for additional error messages
- Network tab to see the actual API request/response
- Supabase Dashboard → Database → Table Editor → lab_test_config to verify the schema
