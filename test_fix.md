# Test Steps to Verify the Fix

## Step 1: Apply Database Schema Fix

### Option A: Run SQL Script Manually
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `manual_fix_schema.sql`
4. Execute the script

### Option B: Apply Migrations (if you have access)
```bash
npx supabase migration up
# or
npx supabase db push
```

## Step 2: Test the Application

1. **Refresh the browser** to reload the application
2. **Open DevTools Console** to see debug messages
3. **Navigate to FinalBill page**
4. **Try to save a clinical service**:
   - Go to Service Selection
   - Pick a clinical service
   - Click on a service to save it
   - Watch the console for success/error messages

## Step 3: Expected Results

### ✅ SUCCESS indicators:
- Console shows: `✅ [CLINICAL SAVE] Schema verification passed`
- Console shows: `🔄 [CLINICAL SAVE] Using UUID foreign key assignment`
- Console shows: `✅ Clinical service saved successfully with UUID foreign key`
- Success toast message appears
- No "clinical_service_rate" error

### ❌ If still failing:
- Check console for specific error messages
- Look for RLS (Row Level Security) policy errors
- Verify the clinical_services and mandatory_services tables exist
- Check if user has proper permissions

## Step 4: Verify Database State

After successful save, you should see:
- `visits.clinical_service_id` contains a UUID
- The UUID matches an ID from `clinical_services` table
- Backward compatibility: `visits.clinical_services` may still contain JSONB data

## Debug Information

If you still see errors, check:
1. **Schema verification logs**: Look for column existence checks
2. **Permission errors**: RLS policy issues
3. **Foreign key violations**: Referenced tables missing
4. **Data type mismatches**: UUID vs TEXT issues

## Quick Database Check

Run this SQL to verify schema:
```sql
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'visits'
AND column_name LIKE '%service%';
```

Expected columns:
- `clinical_service_id` (uuid)
- `mandatory_service_id` (uuid)
- `clinical_services` (jsonb)
- `mandatory_services` (jsonb)