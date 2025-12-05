# Comment Auto-Save Test Guide

## What was fixed
The comment auto-save functionality in the OPD Patient Table was not working because:
- The database update query was using `visit_id` column instead of `id`
- The state management was using `patient.visit_id` as keys instead of `patient.id`

## Changes made
1. Updated the Supabase query from `.eq('visit_id', visitId)` to `.eq('id', visitId)`
2. Changed all comment-related state keys from `patient.visit_id` to `patient.id`
3. Updated the comment dialog keys and handlers to use `patient.id`

## How to test
1. Navigate to the OPD dashboard
2. Click on the comment icon (green message square) for any patient
3. Type a comment in the dialog box
4. Wait 1.5 seconds - you should see "Saving..." indicator
5. After save completes, you should see "✓ Saved" indicator
6. Close and reopen the comment dialog - your comment should persist
7. Check browser console for any error messages

## Expected behavior
- Comments auto-save after 1.5 seconds of no typing
- "Saving..." indicator appears during save
- "✓ Saved" indicator appears after successful save
- Comments persist when dialog is closed and reopened
- No errors in the browser console

## Database verification
You can verify the comments are saved in the database by running:
```sql
SELECT id, visit_id, comments FROM visits WHERE comments IS NOT NULL;
```