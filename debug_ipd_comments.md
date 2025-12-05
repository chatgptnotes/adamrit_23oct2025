# IPD Dashboard Comments Debugging Guide

## Debug Logging Added

I've added comprehensive debug logging to help diagnose why comments might not be showing in the IPD dashboard.

### What to Check in Browser Console:

1. **When the page loads:**
   - Look for: `✅ TodaysIpdDashboard: Found X visits for [hospital]`
   - Look for: `📊 Sample visit data (first visit):` - This shows the structure of fetched data
   - Look for: `💬 Comments in first visit:` - Shows if comments are being fetched
   - Look for: `📝 Found X visits with comments out of Y total visits`
   - Look for: `💭 Visits with comments:` - Lists all visits that have comments

2. **When clicking the comment icon:**
   - Look for: `🔍 Opening comment dialog for visit: [visit-id]`
   - Look for: `📋 Visit object:` - Shows the complete visit data
   - Look for: `💬 Existing comment from visit.comments:` - Shows the comment value
   - Look for: `📝 Loading comment into dialog:` - Shows what's being loaded

3. **When saving a comment:**
   - Look for: `🔄 Attempting to save comment for visit: [visit-id]`
   - Look for: `✅ Comment saved successfully for visit: [visit-id]`

## How to Test:

1. Open the browser developer console (F12)
2. Navigate to IPD Dashboard
3. Check the console for the initial data fetch logs
4. Add a comment to a patient and save it
5. Close the dialog
6. Click the comment icon again for the same patient
7. Check console logs to see if the comment is in the visit object

## What to Look For:

### If comments ARE in the database but NOT showing:
- The `visit.comments` field will be undefined or null in the console logs
- This means the fetch query isn't including comments

### If comments are fetched but not displaying:
- The `visit.comments` will have a value in console logs
- But the dialog still shows empty
- This indicates a UI state management issue

### If comments work after page refresh:
- This indicates the refetch() isn't working properly
- The data is stale until a full page reload

## Next Steps Based on Findings:

1. **If comments field is missing from fetched data:**
   - Check database to confirm comments exist
   - Verify the query is selecting all columns with `*`

2. **If comments are fetched but not showing:**
   - Check the state management in handleCommentClick
   - Verify the dialog is reading from the correct state key

3. **If it works after refresh but not after save:**
   - The refetch() might not be completing
   - Consider awaiting the refetch or adding a delay