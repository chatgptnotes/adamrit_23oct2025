# 🚀 IMPLEMENTING "MARKETED BY" FIELD - Step-by-Step Guide

## **Where Marketing Field Should Be Added**

Based on code analysis, the patient registration form is in:
- **Main Component:** `/src/components/EditPatientRegistrationDialog.tsx`
- **Form Fields:** `/src/components/EditPatientRegistrationDialog/PatientInfoSection.tsx`

---

## **STEP 1️⃣: Database Schema Update**

Add these 2 columns to `patients` table in Supabase:

```sql
ALTER TABLE patients ADD COLUMN marketed_by TEXT;
ALTER TABLE patients ADD COLUMN referral_source TEXT;

-- Optional: Add foreign key if using UUIDs
-- ALTER TABLE patients ADD COLUMN marketing_user_id UUID REFERENCES marketing_users(id);
```

**Data Types:**
- `marketed_by` → TEXT (store marketing person's name)
- `referral_source` → TEXT (store source: "Advertisement", "Doctor", "Friend", etc.)

---

## **STEP 2️⃣: Update EditPatientRegistrationDialog.tsx**

**File Path:** `/src/components/EditPatientRegistrationDialog.tsx`

### **In formData object (Line 31-60), ADD:**

```typescript
// EXISTING:
relationshipManager: '',
// ... other fields

// 🆕 ADD THESE:
marketedBy: '',           // Marketing person's name
referralSource: '',       // How patient found us
```

### **In useEffect (Line 62-107), ADD:**

```typescript
// EXISTING:
relationshipManager: patient.relationship_manager || '',

// 🆕 ADD THESE:
marketedBy: patient.marketed_by || '',
referralSource: patient.referral_source || '',
```

### **In handleSubmit → updateData (Line 146-175), ADD:**

```typescript
// EXISTING:
relationship_manager: formData.relationshipManager || null,

// 🆕 ADD THESE:
marketed_by: formData.marketedBy || null,
referral_source: formData.referralSource || null,
```

---

## **STEP 3️⃣: Update PatientInfoSection.tsx**

**File Path:** `/src/components/EditPatientRegistrationDialog/PatientInfoSection.tsx`

This component needs to fetch marketing staff list and display dropdown.

### **Add Import (Top of file):**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
```

### **Inside PatientInfoSection Component, ADD this code:**

```typescript
// Fetch marketing staff list
const { data: marketingStaff = [] } = useQuery({
  queryKey: ['marketing-users'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('marketing_users')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data || [];
  },
  staleTime: 60000,
});

// Referral source options
const referralSources = [
  'Advertisement',
  'Doctor Reference',
  'Friend/Family',
  'Previous Patient',
  'Corporate',
  'Social Media',
  'Walk-in',
  'Other'
];
```

### **Add Marketing Section (After existing fields):**

Add this block after the grid containing "Relationship Manager" field (around line 235):

```typescript
{/* MARKETING INFORMATION SECTION */}
<div className="border-t-2 border-green-200 mt-6 pt-4">
  <h4 className="text-sm font-semibold text-green-700 mb-3">Marketing Information</h4>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
    {/* Marketed By */}
    <div className="space-y-2">
      <Label htmlFor="marketedBy" className="text-sm font-medium">
        Marketed By
      </Label>
      <Select 
        value={formData.marketedBy} 
        onValueChange={(value) => onInputChange('marketedBy', value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select marketing person..." />
        </SelectTrigger>
        <SelectContent>
          {marketingStaff.map((staff) => (
            <SelectItem key={staff.id} value={staff.name}>
              {staff.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500">Person who referred this patient</p>
    </div>

    {/* Referral Source */}
    <div className="space-y-2">
      <Label htmlFor="referralSource" className="text-sm font-medium">
        Referral Source
      </Label>
      <Select 
        value={formData.referralSource} 
        onValueChange={(value) => onInputChange('referralSource', value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="How did patient find us?" />
        </SelectTrigger>
        <SelectContent>
          {referralSources.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500">Source of referral</p>
    </div>
  </div>
</div>
```

---

## **STEP 4️⃣: Update Props Interface**

In PatientInfoSection component (line 10-15), formData interface should already accept the new fields since it uses `any` type.

If needed, update to:
```typescript
interface PatientInfoSectionProps {
  formData: any;  // Already accepts any fields
  // ... rest of props
}
```

---

## **STEP 5️⃣: Test Locally**

### **Test Workflow:**

1. Go to: Patient → Edit Patient (or Create new)
2. Scroll to "Marketing Information" section (bottom)
3. Select "Marketed By": Choose any marketing person (e.g., "Rahul Sharma")
4. Select "Referral Source": Choose "Advertisement"
5. Save patient
6. Check if fields saved in database

### **Verify in Supabase:**

1. Go to Supabase dashboard
2. Open `patients` table
3. Find the patient you just edited
4. Check columns: `marketed_by` and `referral_source` populated ✓

---

## **STEP 6️⃣: Link to Marketing Incentives**

Once patient is created with `marketed_by = "Rahul Sharma"`:

When a doctor visit is created:
- System auto-reads: `patients.marketed_by`
- Stores in: `doctor_visits.marketing_user_id`
- Marketing dashboard auto-counts visits for that person

---

## **📋 Complete File Changes Summary**

### **Files to Modify:**

1. **EditPatientRegistrationDialog.tsx**
   - Add 2 fields to formData
   - Add 2 fields to useEffect
   - Add 2 fields to updateData

2. **PatientInfoSection.tsx**
   - Add imports (useQuery, supabase)
   - Add query to fetch marketing staff
   - Add referralSources array
   - Add Marketing Information section with 2 selects

3. **Database (Supabase)**
   - ALTER TABLE patients ADD COLUMN marketed_by TEXT
   - ALTER TABLE patients ADD COLUMN referral_source TEXT

---

## **✅ Checklist**

- [ ] Add columns to patients table (Supabase)
- [ ] Update formData in EditPatientRegistrationDialog.tsx
- [ ] Update useEffect in EditPatientRegistrationDialog.tsx
- [ ] Update updateData in EditPatientRegistrationDialog.tsx
- [ ] Add imports to PatientInfoSection.tsx
- [ ] Add query hook to PatientInfoSection.tsx
- [ ] Add marketing section to PatientInfoSection.tsx
- [ ] Test: Create/edit patient with marketed_by
- [ ] Verify data in Supabase
- [ ] Test with John Smith data
- [ ] Deploy to Vercel

---

## **🎯 Expected Result**

Once implemented:
1. ✅ Patient registration has "Marketed By" & "Referral Source" fields
2. ✅ Data saves to database
3. ✅ Doctor visit auto-inherits marketed_by
4. ✅ Marketing dashboard auto-counts visits
5. ✅ Incentives auto-update based on visit count

