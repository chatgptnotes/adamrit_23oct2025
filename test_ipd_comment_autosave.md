# IPD Dashboard Comment Auto-Save Test Guide

## What was fixed
The comment auto-save functionality in the IPD Dashboard had two issues:
1. The database update query was using `visit_id` column instead of `id`
2. The state management was using `visit.visit_id` as keys instead of `visit.id`
3. **NEW**: Comments were not showing previous values when reopening the dialog

## Changes made
1. **Database Query Fix** (line 1432): Updated from `.eq('visit_id', visitId)` to `.eq('id', visitId)`
2. **State Management Keys** (lines 1391, 1397, 1403): Changed from `visit.visit_id` to `visit.id`
3. **Dialog Rendering** (lines 2297-2332): Updated all references from `visit.visit_id` to `visit.id`
4. **Data Refresh Fix** (line 1457): Added `refetch()` after successful save to refresh the visits data

## How to test
1. Navigate to the IPD Dashboard
2. Click on the comment icon (green message square) for any patient
3. Type a comment in the dialog box (like "test comment")
4. Wait 1.5 seconds - you should see "Saving..." indicator
5. After save completes, you should see "✓ Saved" indicator
6. Close the dialog
7. Click the comment icon again for the same patient
8. The previously saved comment should appear automatically

## Expected behavior
- Comments auto-save after 1.5 seconds of no typing
- "Saving..." indicator appears during save operation
- "✓ Saved" indicator appears after successful save
- Comments persist in the database
- When reopening the comment dialog, previous comments are displayed
- No errors in the browser console

## Database verification
You can verify the comments are saved in the database by running:
```sql
SELECT id, visit_id, comments FROM visits
WHERE comments IS NOT NULL
AND patient_type = 'IPD';
```

## Troubleshooting
If comments are not saving:
1. Check browser console for error messages
2. Verify that the visit record has an `id` field
3. Ensure the user has write permissions to the visits table
4. Check network tab to see if the Supabase update request is being made