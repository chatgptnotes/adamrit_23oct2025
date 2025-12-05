# Discharge Summary Button - Conditional Enable/Disable

## Implementation Summary

### Requirement
The "Discharge Summary" button in OPD Patient Dashboard should be:
- **Disabled** by default (gray, not clickable)
- **Enabled** only after clicking "Save & Discharge" in Final Payment dialog

### Changes Made

#### 1. Database Migration
**File:** `supabase/migrations/20251004150000_add_discharge_tracking.sql`

Added two new columns to `visits` table:
```sql
- is_discharged: BOOLEAN DEFAULT FALSE
- discharge_date: TIMESTAMP WITH TIME ZONE
```

**To Apply:**
Run this SQL in Supabase SQL Editor to add the columns.

#### 2. FinalBill.tsx Updates
**File:** `src/pages/FinalBill.tsx`
**Line:** 2466

Added `is_discharged: true` when "Save & Discharge" is clicked:
```typescript
await supabase
  .from('visits')
  .update({
    ...
    is_discharged: true // Enable discharge summary button
  })
  .eq('visit_id', visitId);
```

#### 3. OPD Patient Table Updates
**File:** `src/components/opd/OpdPatientTable.tsx`

**a) Updated Patient Interface (Lines 34-35):**
```typescript
interface Patient {
  ...
  is_discharged?: boolean;
  discharge_date?: string;
}
```

**b) Updated Discharge Summary Button (Lines 977-986):**
```typescript
<Button
  disabled={!patient.is_discharged}
  title={patient.is_discharged ? "View/Add Discharge Summary" : "Complete final payment to enable"}
>
  <FileTextIcon className={`h-4 w-4 ${patient.is_discharged ? 'text-purple-600' : 'text-gray-400'}`} />
</Button>
```

### How It Works

#### Before Final Payment:
1. Patient appears in OPD dashboard
2. `is_discharged` = FALSE
3. Discharge Summary button is:
   - Grayed out (text-gray-400)
   - Not clickable (disabled)
   - Shows tooltip: "Complete final payment to enable"

#### After Final Payment:
1. User opens Final Payment dialog
2. Fills in payment details
3. Clicks "Save & Discharge"
4. System sets `is_discharged = TRUE` in database
5. OPD dashboard refreshes
6. Discharge Summary button is:
   - Purple colored (text-purple-600)
   - Clickable (enabled)
   - Shows tooltip: "View/Add Discharge Summary"
   - Navigates to discharge summary page

### Visual States

**Disabled State:**
- Icon color: Gray (#9CA3AF)
- Button: Not clickable
- Cursor: not-allowed
- Tooltip: "Complete final payment to enable"

**Enabled State:**
- Icon color: Purple (#9333EA)
- Button: Clickable
- Cursor: pointer
- Tooltip: "View/Add Discharge Summary"

### Database Schema

```sql
visits table:
├── is_discharged: BOOLEAN DEFAULT FALSE
│   └── Set to TRUE when final payment is completed
└── discharge_date: TIMESTAMP
    └── Records when patient was discharged
```

### Testing Checklist

- [ ] Run migration SQL in Supabase
- [ ] Verify is_discharged column exists in visits table
- [ ] Open OPD dashboard
- [ ] Verify Discharge Summary button is gray/disabled for new patients
- [ ] Click Final Payment for a patient
- [ ] Fill payment details and click "Save & Discharge"
- [ ] Verify button becomes purple/enabled
- [ ] Click button to ensure navigation works

### Files Modified

1. `supabase/migrations/20251004150000_add_discharge_tracking.sql` - NEW
2. `src/pages/FinalBill.tsx` - Modified line 2466
3. `src/components/opd/OpdPatientTable.tsx` - Modified lines 34-35, 977-986

### Migration Required

**IMPORTANT:** You must run the SQL migration before this feature works!

```bash
# In Supabase SQL Editor, run:
supabase/migrations/20251004150000_add_discharge_tracking.sql
```

Or manually run:
```sql
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS is_discharged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMP WITH TIME ZONE;
```

