# 🚀 Marketing Incentives Implementation Plan

## **Goal:** Link Patient Referrals → Marketing Person → Auto-Calculate Incentive

---

## **3-STEP INTEGRATION**

### **STEP 1️⃣: Add "Marketed By" Field to Patient Registration**

**File to Modify:** `/src/components/AddPatientDialog.tsx`

```typescript
// Add this section in patient form:

<section className="border-t pt-4 mt-4">
  <h3 className="text-sm font-semibold mb-3">Marketing Information</h3>
  
  <div className="grid grid-cols-2 gap-3">
    {/* Marketed By */}
    <div>
      <label className="text-xs font-medium mb-1 block">
        Marketed By
      </label>
      <Select value={form.marketed_by} onValueChange={v => setForm({...form, marketed_by: v})}>
        <SelectTrigger>
          <SelectValue placeholder="Select marketing person..." />
        </SelectTrigger>
        <SelectContent>
          {marketingStaff.map(staff => (
            <SelectItem key={staff.id} value={staff.id}>
              {staff.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Referral Source */}
    <div>
      <label className="text-xs font-medium mb-1 block">
        Referral Source
      </label>
      <Select value={form.referral_source} onValueChange={v => setForm({...form, referral_source: v})}>
        <SelectTrigger>
          <SelectValue placeholder="Select source..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="advertisement">Advertisement</SelectItem>
          <SelectItem value="doctor_reference">Doctor Reference</SelectItem>
          <SelectItem value="friend">Friend/Family</SelectItem>
          <SelectItem value="previous_patient">Previous Patient</SelectItem>
          <SelectItem value="corporate">Corporate</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Marketing Notes */}
    <div className="col-span-2">
      <label className="text-xs font-medium mb-1 block">
        Marketing Notes (Optional)
      </label>
      <Textarea 
        placeholder="Campaign name, notes, etc."
        value={form.marketing_notes}
        onChange={e => setForm({...form, marketing_notes: e.target.value})}
        rows={2}
      />
    </div>
  </div>
</section>
```

### **Database Addition:**

```sql
-- Add to patients table
ALTER TABLE patients ADD COLUMN marketed_by TEXT;
ALTER TABLE patients ADD COLUMN referral_source TEXT;
ALTER TABLE patients ADD COLUMN marketing_notes TEXT;

-- Optional: Add foreign key
ALTER TABLE patients 
ADD COLUMN marketing_user_id UUID,
ADD CONSTRAINT fk_marketed_by 
FOREIGN KEY (marketing_user_id) 
REFERENCES marketing_users(id);
```

---

### **STEP 2️⃣: Auto-Link Marketing Person in Doctor Visit**

**File to Modify:** `/src/pages/Lab.tsx` or Doctor Visit creation form

```typescript
// When creating doctor visit, auto-populate from patient:

const handleCreateVisit = async (patientId, testData) => {
  // 1. Fetch patient record
  const { data: patient } = await supabase
    .from('patients')
    .select('marketed_by, marketing_user_id')
    .eq('id', patientId)
    .single();

  // 2. Create visit with marketing link
  const { error } = await supabase
    .from('doctor_visits')
    .insert({
      patient_id: patientId,
      visit_date: new Date().toISOString().split('T')[0],
      marketing_user_id: patient?.marketing_user_id,  // ← AUTO-LINK
      test_data: testData,
      outcome: 'success'
    });

  if (!error) {
    toast.success('Visit recorded & linked to marketing person');
  }
};
```

### **UI Display in Doctor Visit Form:**

```typescript
// Show marketing person as read-only badge:

{patient?.marketed_by && (
  <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-3">
    <p className="text-xs text-gray-600">Referred by:</p>
    <Badge className="mt-1">{patient.marketed_by}</Badge>
  </div>
)}
```

---

### **STEP 3️⃣: Marketing Dashboard Auto-Calculates**

**Already Done!** The Marketing Incentives dashboard automatically:

```
1. Queries doctor_visits table
2. Counts visits where marketing_user_id = staff_id
3. Filters by month
4. Calculates achievement %
5. Applies incentive slab
6. Shows in dashboard
```

**No changes needed!** Dashboard will automatically update as visits are recorded.

---

## **🔄 Complete Flow Visualization**

```
STEP 1: REGISTER PATIENT WITH MARKETING PERSON
═════════════════════════════════════════════════

Receptionist/Admin:
  1. Opens: /patients → Add Patient
  2. Fills: Patient details
  3. Selects: "Marketed By: Rahul Sharma" ← NEW FIELD
  4. Selects: "Referral Source: Advertisement" ← NEW FIELD
  5. Saves: Patient record
  
  Database Update:
  ├─ patients.name = "John Smith"
  ├─ patients.phone = "9876543210"
  ├─ patients.marketed_by = "Rahul Sharma"
  └─ patients.marketing_user_id = "uuid-of-rahul"


STEP 2: DOCTOR/LAB VISIT CREATES RECORD
═════════════════════════════════════════════════

Lab Technician:
  1. Opens: /lab → Create Lab Test
  2. Selects: Patient "John Smith"
  3. System auto-shows: "Referred by: Rahul Sharma" ← AUTO
  4. Enters: Lab tests, date, results
  5. Saves: Visit record
  
  Database Update:
  ├─ doctor_visits.patient_id = "john-uuid"
  ├─ doctor_visits.marketing_user_id = "uuid-of-rahul" ← AUTO
  ├─ doctor_visits.visit_date = "2026-04-25"
  └─ doctor_visits.outcome = "success"


STEP 3: MARKETING DASHBOARD AUTO-UPDATES
═════════════════════════════════════════════════

Manager:
  1. Opens: /marketing-incentives
  2. Selects: Month "April 2026"
  3. System counts:
     ├─ All visits for April
     ├─ Where marketing_user_id = "rahul"
     ├─ Result: 85 visits
     └─ Achievement: 85%
  
  4. Dashboard shows:
     ├─ Rahul Sharma
     ├─ Visits: 85
     ├─ Progress: 85%
     ├─ Slab: 80-99% = ₹5,000
     └─ Incentive: ₹5,000 ✓

NO MANUAL ENTRY REQUIRED!
```

---

## **📊 Database Structure**

```sql
-- MARKETING USERS
marketing_users
├─ id (UUID)
├─ name (VARCHAR)
├─ email (VARCHAR)
├─ phone (VARCHAR)
└─ is_active (BOOLEAN)

-- PATIENTS (with new fields)
patients
├─ id (UUID)
├─ name (VARCHAR)
├─ phone (VARCHAR)
├─ address (TEXT)
├─ marketed_by (VARCHAR) ← NEW
├─ marketing_user_id (UUID) ← NEW (FK to marketing_users)
├─ referral_source (VARCHAR) ← NEW
└─ marketing_notes (TEXT) ← NEW

-- DOCTOR VISITS (links to marketing)
doctor_visits
├─ id (UUID)
├─ patient_id (UUID) → patients.id
├─ marketing_user_id (UUID) ← LINKS TO MARKETING
├─ visit_date (DATE)
├─ outcome (VARCHAR)
└─ test_data (JSON)
```

---

## **⚡ Real-Time Tracking Example**

### **April 2026 Scenario**

```
Timeline:
─────────

Apr 1: Rahul Sharma registers patient via /patients page
       Database: patients.marketed_by = "Rahul Sharma"

Apr 5: Patient visits lab
       Database: doctor_visits.marketing_user_id = "rahul"

Apr 10: Another patient visits
        Database: doctor_visits count for Rahul = 2

...

Apr 30: Manager checks incentives
        Dashboard queries: COUNT(visits) WHERE marketing_user_id = "rahul"
        Result: 85 visits → Achievement 85% → ₹5,000 incentive
        
NO MANUAL WORK!
```

---

## **🧪 Testing Checklist**

- [ ] Add "Marketed By" field to Add Patient form
- [ ] Create test patient with "Rahul Sharma" as marketed_by
- [ ] Create doctor visit for that patient
- [ ] Check marketing dashboard
- [ ] Verify Rahul's visit count increases by 1
- [ ] Verify incentive auto-updates
- [ ] Test with multiple patients/staff
- [ ] Verify month navigation works

---

## **🚀 Implementation Order**

1. **Day 1:** Add marketed_by field to AddPatientDialog.tsx
2. **Day 1:** Add database columns (ALTER TABLE patients)
3. **Day 2:** Update doctor visit form to auto-link
4. **Day 2:** Test with dummy data
5. **Day 3:** Deploy to Vercel
6. **Day 3:** Go Live!

---

## **📋 Summary**

**What Happens:**

```
Patient Registration
    ↓
  Selects: "Marketed By: Rahul Sharma"
    ↓
Patient Visits Lab
    ↓
  Auto-links to: Rahul Sharma
    ↓
Marketing Dashboard
    ↓
  Counts visit + Updates incentive
    ↓
Incentive Payment
    ↓
  ✅ Automatic based on visit count
```

**No Manual Intervention Needed!** 🎉
