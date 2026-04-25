# 📊 MARKETED BY FIELD - COMPLETE IMPLEMENTATION SUMMARY

## **🎯 What You Need to Do (3 Simple Tasks)**

---

## **TASK 1: Database - Add 2 Columns to Patients Table**

### **Where:** Supabase Console → SQL Editor

### **What to Run:**

```sql
ALTER TABLE patients ADD COLUMN marketed_by TEXT;
ALTER TABLE patients ADD COLUMN referral_source TEXT;
```

### **Why:** To store which marketing person referred the patient

---

## **TASK 2: Code - Update EditPatientRegistrationDialog.tsx**

### **File:** `/src/components/EditPatientRegistrationDialog.tsx`

### **Changes Required:**

**Location 1: formData object (around line 31-60)**
```
Find: relationshipManager: '',
Add After:
  marketedBy: '',
  referralSource: '',
```

**Location 2: useEffect (around line 62-107)**
```
Find: relationshipManager: patient.relationship_manager || '',
Add After:
  marketedBy: patient.marketed_by || '',
  referralSource: patient.referral_source || '',
```

**Location 3: updateData in handleSubmit (around line 146-175)**
```
Find: relationship_manager: formData.relationshipManager || null,
Add After:
  marketed_by: formData.marketedBy || null,
  referral_source: formData.referralSource || null,
```

---

## **TASK 3: Code - Update PatientInfoSection.tsx**

### **File:** `/src/components/EditPatientRegistrationDialog/PatientInfoSection.tsx`

### **Change 1: Add Imports (Top of file)**

After existing imports, add:
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
```

### **Change 2: Inside Component (After opening return), Add Query:**

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

### **Change 3: Add Marketing Section (End of JSX, before closing div)**

After the existing grid with "Relationship Manager", add:

```typescript
{/* MARKETING INFORMATION SECTION */}
<div className="border-t-2 border-green-200 mt-6 pt-4">
  <h4 className="text-sm font-semibold text-green-700 mb-3">Marketing Information</h4>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

## **🧪 TESTING STEPS**

### **After Making Changes:**

1. **Start dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Go to Patient Edit Page**:
   - Open: `http://localhost:8080/patients`
   - Find any patient (or John Smith)
   - Click on patient to edit
   - Scroll down to see "Marketing Information" section

3. **Test the Fields**:
   - Click "Marketed By" dropdown
   - Select: "Rahul Sharma" (or any marketing person)
   - Click "Referral Source" dropdown
   - Select: "Advertisement"
   - Click "Save Patient"
   - Verify success message appears

4. **Verify in Supabase**:
   - Go to: https://supabase.com
   - Login to your project
   - Open: SQL Editor
   - Run: `SELECT name, marketed_by, referral_source FROM patients WHERE name = 'John Smith' LIMIT 1;`
   - Verify: marketed_by and referral_source columns populated ✓

---

## **📋 COMPLETE WORKFLOW (After Implementation)**

```
PATIENT JOURNEY:
────────────────────────────────────────

1. Receptionist registers patient
   ├─ Fills: Name, Phone, Address, etc.
   └─ 🆕 SELECTS: "Marketed By: Rahul Sharma"
   
2. Data saved to database
   ├─ patients.name = "John Smith"
   └─ patients.marketed_by = "Rahul Sharma" ✓

3. Patient visits lab
   ├─ Lab tech creates visit record
   └─ System auto-reads: marketed_by from patient
   
4. Marketing Dashboard Updates
   ├─ System counts: 1 visit for Rahul
   ├─ Rahul's monthly total: 85 visits
   └─ Incentive: ₹5,000 (auto-calculated) ✓
```

---

## **🔍 Verify Each Step**

### **Step 1 - Database Columns Added:**
- [ ] No error when running SQL commands
- [ ] Check Supabase → patients table → marketed_by column exists
- [ ] Check Supabase → patients table → referral_source column exists

### **Step 2 - Code Updated (EditPatientRegistrationDialog.tsx):**
- [ ] formData includes: marketedBy, referralSource
- [ ] useEffect includes: marketedBy, referralSource
- [ ] updateData includes: marketed_by, referral_source

### **Step 3 - Code Updated (PatientInfoSection.tsx):**
- [ ] Imports added: useQuery, supabase
- [ ] Query hook added: marketingStaff list
- [ ] Marketing section added: 2 dropdown fields
- [ ] No TypeScript errors on save

### **Step 4 - Test Locally:**
- [ ] Dev server runs without errors
- [ ] Marketed By dropdown shows list of staff
- [ ] Referral Source dropdown shows list of sources
- [ ] Can select and save values
- [ ] Values appear in Supabase

---

## **⏭️ Next: Link to Doctor Visits**

Once this is working, we'll:

1. Update doctor visit creation to auto-inherit marketed_by
2. Marketing dashboard auto-counts visits
3. Incentives auto-calculate

**But that's AFTER this is complete!** 

---

## **✅ YOU'RE READY TO IMPLEMENT!**

### **Summary:**
- 3 Tasks
- 2 Code files
- 1 Database change
- ~30 minutes of work

**Would you like me to EXPLAIN these changes in more detail before you implement them?**

Or are you ready to start making these changes yourself? 🚀
