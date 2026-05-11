# 📊 Marketing Incentives Integration Guide

## 🎯 Complete Workflow: Patient Referral → Incentive Calculation

### **Architecture Overview**

```
Marketing Staff
     ↓
Refers Patient
     ↓
Patient Record Created (with marketing_user_id)
     ↓
Patient visits Doctor/Lab
     ↓
Doctor Visit Recorded (linked to marketing_user_id)
     ↓
Marketing Incentives Dashboard Calculates Incentive
```

---

## 📋 **Step 1: Record Patient Referral Source**

### **Where to add Marketing Person?**

The `patients` table has a `relationship_manager` field that can store the marketing person's name.

**Option A: Use relationship_manager field**
```typescript
// When creating patient:
{
  name: "John Smith",
  phone: "9876543210",
  relationship_manager: "Rahul Sharma",  // Marketing person's name
  // ... other fields
}
```

**Option B: Add new field (Better approach)**
Add a new field to patients table:
```sql
ALTER TABLE patients ADD COLUMN marketed_by TEXT;
-- Links to marketing_users.id or name
```

---

## 👥 **Step 2: Marketing Person Creates/Adds Patient**

### **Current UI Location:**
- Go to: `/patients` page
- Click: "Add Patient" button
- New field needed: **"Marketed By"** dropdown

### **Form Fields:**
```
Patient Form
├─ Patient Name *
├─ Phone *
├─ Address
├─ Age
├─ Gender
├─ Date of Birth
├─ Insurance Details
├─ Emergency Contact
│
└─ 🆕 MARKETING SECTION
   ├─ Marketed By (Dropdown) *
   │  └─ Select: Rahul Sharma, Suraj, Lokesh, etc.
   │
   ├─ Referral Source
   │  └─ Select: Advertisement, Doctor Reference, Friend, etc.
   │
   └─ Marketing Notes (Optional)
      └─ Campaign name, how they found us, etc.
```

---

## 🏥 **Step 3: Record Doctor Visit (Auto-Link Marketing)**

### **Current Flow:**
1. Patient comes for consultation/lab test
2. Doctor creates a visit record
3. System auto-fills the `marketed_by` field from patient record

### **Doctor Visit Recording:**
```
Visit Creation Form
├─ Patient (Auto-populates from selection)
│  └─ Shows: "Marketed By: Rahul Sharma"
│
├─ Visit Date *
├─ Visit Type (Consultation/Lab/Etc)
├─ Doctor/Technician *
│
└─ Marketing Info (Auto-filled):
   ├─ marketing_user_id: xxxxxxxx
   ├─ marketing_user_name: "Rahul Sharma"
   └─ referral_source: "Advertisement"
```

---

## 💰 **Step 4: Marketing Incentives Auto-Calculate**

### **System Auto-Tracks:**

When doctor_visits table is updated:

```javascript
// Doctor Visit Record
{
  id: "visit-123",
  patient_id: "pat-456",
  marketing_user_id: "rahul-789",        // ← KEY LINK
  visit_date: "2026-04-25",
  outcome: "success",
  doctor_name: "Dr. Sharma"
}

// Marketing Dashboard sees this and updates:
// Rahul Sharma's April 2026 count: +1 visit
// If 85+ visits → ₹5,000 incentive auto-calculated
```

---

## 📊 **Marketing Incentives Dashboard Updates Automatically**

### **Real-Time Tracking:**

```
Marketing Incentives Page
│
├─ Select Month: April 2026
│
└─ For each Marketing Staff:
   ├─ Rahul Sharma
   │  ├─ Visits This Month: 85
   │  │  └─ (System counts all doctor_visits 
   │  │     where marketing_user_id = rahul)
   │  │
   │  ├─ Camps This Month: 2
   │  ├─ Achievement: 85% (85/100)
   │  ├─ Progress Bar: 85% filled
   │  └─ Incentive: ₹5,000
   │
   └─ Suraj
      ├─ Visits This Month: 115
      ├─ Camps: 3
      ├─ Achievement: 115%
      └─ Incentive: ₹10,000 + ₹1,500 bonus
```

---

## 🔧 **Implementation Checklist**

### **UI Changes Needed:**

1. **Patients Page** → Add "Marketed By" field
   ```
   /src/pages/Patients.tsx
   - Add dropdown to select marketing person
   - Save selected person to patients table
   ```

2. **Add Patient Dialog** → Add Marketing Section
   ```
   /src/components/AddPatientDialog.tsx
   - Add marketing staff dropdown
   - Add referral source field
   - Add marketing notes textarea
   ```

3. **Doctor Visit/Lab Test Page** → Auto-show Marketing Info
   ```
   /src/pages/Lab.tsx or DoctorVisit.tsx
   - Auto-populate marketed_by from patient record
   - Show as read-only badge
   - Use for incentive tracking
   ```

### **Database Changes Needed:**

1. **Add columns to patients table:**
   ```sql
   ALTER TABLE patients ADD COLUMN marketed_by TEXT;
   ALTER TABLE patients ADD COLUMN referral_source TEXT;
   ALTER TABLE patients ADD COLUMN marketing_notes TEXT;
   ```

2. **Ensure doctor_visits has marketing_user_id:**
   ```sql
   -- If not exists, add:
   ALTER TABLE doctor_visits ADD COLUMN marketing_user_id TEXT;
   ```

3. **Create view for incentive calculation:**
   ```sql
   CREATE VIEW marketing_monthly_stats AS
   SELECT 
     marketing_user_id,
     DATE_TRUNC('month', visit_date) as month,
     COUNT(*) as visit_count
   FROM doctor_visits
   GROUP BY marketing_user_id, month
   ```

---

## 📈 **Data Flow Diagram**

```
┌──────────────────────────────────────────────────────────┐
│                    MARKETING STAFF                        │
│                    (11 members)                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ Creates/Refers
                     ↓
        ┌─────────────────────────┐
        │  PATIENT RECORD         │
        ├─────────────────────────┤
        │ Name: John Smith        │
        │ Phone: 9876543210       │
        │ Marketed By: Rahul ◄─── Link to Marketing Person
        │ Referral: Advertisement │
        └────────────┬────────────┘
                     │
                     │ Patient visits
                     ↓
        ┌─────────────────────────┐
        │  DOCTOR VISIT           │
        ├─────────────────────────┤
        │ Visit Date: 2026-04-25  │
        │ Marketing ID: rahul-123 ◄─── Inherited from Patient
        │ Outcome: Success        │
        └────────────┬────────────┘
                     │
                     │ System counts visits
                     ↓
        ┌─────────────────────────┐
        │ MARKETING DASHBOARD     │
        ├─────────────────────────┤
        │ Rahul Sharma:           │
        │ • Visits: 85            │
        │ • Achievement: 85%      │
        │ • Incentive: ₹5,000     │
        └─────────────────────────┘
```

---

## 💡 **Real-World Example**

### **Scenario: Rahul Sharma refers John Smith**

**Step 1: Register Patient (April 1, 2026)**
```
Rahul clicks: Patients → Add Patient
Fills in:
  - Name: John Smith
  - Phone: 9876543210
  - Marketed By: Rahul Sharma ✓
  - Referral Source: Advertisement ✓
```

**Step 2: Patient Visits Lab (April 10, 2026)**
```
Doctor creates visit:
  - Patient: John Smith
  - Visit Date: 2026-04-10
  - Lab Tests: CBC, Blood Sugar
  - System auto-fills: marketed_by = "Rahul Sharma"
```

**Step 3: View Marketing Incentives (April 30, 2026)**
```
Go to: /marketing-incentives
Select Month: April 2026
Click: Rahul Sharma
System shows:
  - John Smith: ✓ Counted (1 visit)
  - Total Visits: 85
  - Achievement: 85%
  - Incentive: ₹5,000 ✓
```

---

## 🔄 **Automatic Updates**

Once setup is complete, incentives update **in real-time**:

```javascript
// Every time a new visit is created:
1. System reads patient.marketed_by
2. Links visit to that marketing_user_id
3. Recount visits for that month
4. Recalculate incentive slab
5. Marketing Dashboard updates automatically

// No manual entry needed!
```

---

## 📋 **Summary: 3 Simple Steps**

1. **Patients Page:** Add "Marketed By" dropdown
2. **Patient Record:** Store marketing person's name
3. **Doctor Visit:** Auto-inherit marketed_by from patient
4. **Dashboard:** Auto-counts visits → Auto-calculates incentive

**Result:** 
- ✅ Every patient tracked to referral source
- ✅ Every visit counted automatically
- ✅ Incentives calculated real-time
- ✅ No manual entry required

---

## 🚀 **Next Steps**

1. **UI Development**: Add marketing fields to patient forms
2. **Database**: Add marketed_by column to patients table
3. **Testing**: Create test patients with different marketers
4. **Deploy**: Push to Vercel
5. **Launch**: All 3 Batch 2 features fully integrated
