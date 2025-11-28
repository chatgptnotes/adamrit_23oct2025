# Troubleshooting: Discharged Patients Not Showing

## Issue
"No discharged patients found" message appears even after discharging patients.

## Step-by-Step Diagnosis & Fix

### Step 1: Run Diagnostic Query (MOST IMPORTANT)

Open your database SQL editor (Supabase dashboard or PgAdmin) and run:

```bash
\i diagnose_discharged_patients_issue.sql
```

Or copy-paste the contents of `diagnose_discharged_patients_issue.sql` into your SQL editor.

This will show you:
- ✅ If any patients have discharge_date
- ✅ What their patient_type is
- ✅ What their status is
- ✅ What's blocking them from showing

### Step 2: Apply Migrations

If migrations are not applied yet, run:

```bash
supabase db push
```

Or manually run these migration files in order:

1. `20251007000000_backfill_admission_dates.sql`
2. `20251007000001_populate_doctor_diagnosis_junction_tables.sql`
3. `20251007000002_fix_discharge_date_to_timestamp.sql`
4. `20251007000003_set_status_discharged_for_existing.sql`

### Step 3: Check Browser Console

Open browser DevTools (F12) and go to Console tab. Look for:

```
🏥 Found X discharged patients (IPD & Emergency) for hospital: YOUR_HOSPITAL_NAME
```

- If it says "Found 0 discharged patients" → Problem is in database (patients not discharged or wrong fields)
- If it says "Found X discharged patients" but still shows empty → Problem is client-side filter

### Step 4: Verify a Patient is Actually Discharged

Run this query to check:

```sql
SELECT
    visit_id,
    patient_type,
    status,
    discharge_date,
    is_discharged,
    bill_paid
FROM visits
WHERE discharge_date IS NOT NULL
ORDER BY discharge_date DESC
LIMIT 5;
```

**Expected Result:**
- patient_type = 'IPD' or 'Emergency'
- status = 'discharged'
- discharge_date = actual timestamp (not NULL)
- is_discharged = true
- bill_paid = true

If ANY of these are wrong, that's your problem!

### Step 5: Quick Test - Manually Discharge a Patient

If you need to test immediately, use `quick_fix_discharge_patient.sql`:

1. Find a visit_id to discharge
2. Replace 'REPLACE_WITH_ACTUAL_VISIT_ID' with actual visit_id
3. Uncomment and run the UPDATE statement
4. Refresh the Discharged Patients page

### Step 6: Check Hospital Filter

The DischargedPatients page filters by `patients.hospital_name`.

Run this to see what hospital names exist:

```sql
SELECT DISTINCT hospital_name, COUNT(*)
FROM patients
GROUP BY hospital_name;
```

Make sure your `hospitalConfig.name` matches EXACTLY (case-sensitive).

## Common Issues & Fixes

### Issue 1: No patients with discharge_date
**Symptom:** Query 1 in diagnostic shows 0 patients
**Fix:** Discharge a patient using Final Bill → Invoice button

### Issue 2: Patient_type is not IPD/Emergency
**Symptom:** Query 4 shows "WRONG PATIENT_TYPE"
**Fix:**
```sql
UPDATE visits
SET patient_type = 'IPD'
WHERE visit_id = 'YOUR_VISIT_ID';
```

### Issue 3: Status is not 'discharged'
**Symptom:** Query 4 shows "WRONG STATUS"
**Fix:** Run migration `20251007000003_set_status_discharged_for_existing.sql`

### Issue 4: Hospital name mismatch
**Symptom:** Browser console shows "Found 0 patients" but database has discharged patients
**Fix:** Check hospitalConfig.name matches patients.hospital_name exactly

## Emergency Quick Fix

If you just need ONE patient to show for testing:

```sql
-- Find first IPD patient
SELECT visit_id FROM visits
WHERE patient_type IN ('IPD', 'Emergency')
AND discharge_date IS NULL
LIMIT 1;

-- Discharge them (replace VISIT_ID)
UPDATE visits
SET
    discharge_date = NOW(),
    discharge_mode = 'recovery',
    bill_paid = true,
    is_discharged = true,
    status = 'discharged'
WHERE visit_id = 'VISIT_ID_HERE';
```

Then refresh the page!

## Final Checklist

Before asking for help, verify:

- [ ] Ran `diagnose_discharged_patients_issue.sql`
- [ ] Ran all migrations (`supabase db push`)
- [ ] Checked browser console for error messages
- [ ] Verified at least one patient has:
  - [ ] discharge_date IS NOT NULL
  - [ ] patient_type = 'IPD' or 'Emergency'
  - [ ] status = 'discharged'
- [ ] Checked hospital_name matches hospitalConfig.name
- [ ] Hard refreshed browser (Ctrl+Shift+R)

## Files to Help You

1. `diagnose_discharged_patients_issue.sql` - Main diagnostic query
2. `verify_discharged_patients.sql` - Additional verification
3. `quick_fix_discharge_patient.sql` - Manually discharge for testing
4. `verify_discharge_datetime.sql` - Check discharge timestamps

Run these queries and you'll find the issue! 🔍
