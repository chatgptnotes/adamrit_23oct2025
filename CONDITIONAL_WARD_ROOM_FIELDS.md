# Conditional Ward/Room Fields - Implementation Summary

## ✅ Feature: Show Ward/Room Only for IPD Patients

Ward Allotted and Room Allotted fields are now **conditionally displayed** based on Patient Type selection.

---

## 📋 Business Rules

### When Ward/Room Fields Show:
✅ **IPD (Inpatient)** - Shows ward and room fields
✅ **Emergency** - Shows ward and room fields
❌ **OPD (Outpatient)** - Hides ward and room fields

### Why?
- **IPD and Emergency patients** need bed allocation → Show ward/room
- **OPD patients** don't need beds → Hide ward/room

---

## 🔧 Implementation Details

### 1. **Conditional Display Logic** (VisitDetailsSection.tsx:158-160)
```typescript
const showWardRoomFields = formData.patientType === 'IPD' ||
                           formData.patientType === 'IPD (Inpatient)' ||
                           formData.patientType === 'Emergency';
```

### 2. **Conditional Rendering** (VisitDetailsSection.tsx:310-380)
```jsx
{showWardRoomFields && (
  <>
    {/* Ward Allotted dropdown */}
    {/* Room Allotted dropdown */}
  </>
)}
```

### 3. **Conditional Validation** (VisitRegistrationForm.tsx:177-184)
```typescript
const requiresWardRoom = formData.patientType === 'IPD' ||
                         formData.patientType === 'IPD (Inpatient)' ||
                         formData.patientType === 'Emergency';

if (requiresWardRoom) {
  if (!formData.wardAllotted) missingFields.push('Ward Allotted');
  if (!formData.roomAllotted) missingFields.push('Room Allotted');
}
```

---

## 📱 User Experience

### Scenario 1: OPD Patient
```
User selects: Patient Type = "OPD (Outpatient)"
Result: Ward/Room fields HIDDEN
Form shows: Visit Date, Patient Type, Visit Type, Appointment With, Reason, Relation, Status
Submit: No ward/room validation
```

### Scenario 2: IPD Patient
```
User selects: Patient Type = "IPD (Inpatient)"
Result: Ward/Room fields VISIBLE
Form shows: All fields + Ward Allotted + Room Allotted
Submit: Ward and Room are REQUIRED
```

### Scenario 3: Emergency Patient
```
User selects: Patient Type = "Emergency"
Result: Ward/Room fields VISIBLE
Form shows: All fields + Ward Allotted + Room Allotted
Submit: Ward and Room are REQUIRED
```

---

## 🎯 Form Behavior

### Patient Type Selection Flow:
1. **User opens** "Register New Visit" form
2. **Selects Patient Type** dropdown
3. **Chooses**:
   - **OPD** → Ward/Room fields disappear ✅
   - **IPD** → Ward/Room fields appear ✅
   - **Emergency** → Ward/Room fields appear ✅

### Dynamic Validation:
- **OPD:** Can submit without ward/room
- **IPD:** Must select ward AND room before submit
- **Emergency:** Must select ward AND room before submit

---

## 🔄 Files Modified

### 1. `src/components/visit/VisitDetailsSection.tsx`
**Line 158-160:** Added conditional logic
```typescript
const showWardRoomFields = formData.patientType === 'IPD' ||
                           formData.patientType === 'IPD (Inpatient)' ||
                           formData.patientType === 'Emergency';
```

**Line 310-380:** Wrapped ward/room fields in conditional
```jsx
{showWardRoomFields && (<> ... </>)}
```

### 2. `src/components/VisitRegistrationForm.tsx`
**Line 177-184:** Added conditional validation
```typescript
const requiresWardRoom = ...
if (requiresWardRoom) { /* validate ward/room */ }
```

---

## ✅ Testing Checklist

- [x] Select OPD → Ward/Room fields hidden
- [x] Select IPD → Ward/Room fields visible
- [x] Select Emergency → Ward/Room fields visible
- [x] Switch from IPD to OPD → Fields hide automatically
- [x] Submit OPD without ward/room → Success
- [x] Submit IPD without ward/room → Validation error
- [x] Submit IPD with ward/room → Success

---

## 🎨 Visual Behavior

### Before (OPD Selected):
```
┌────────────────────────────┐
│ Visit Date         │ Patient Type: OPD │
│ Visit Type         │ Appointment With  │
│ Reason for Visit   │ Relation          │
│ Status             │                   │
└────────────────────────────┘
```

### After (IPD Selected):
```
┌────────────────────────────┐
│ Visit Date         │ Patient Type: IPD │
│ Visit Type         │ Appointment With  │
│ Reason for Visit   │ Relation          │
│ Status             │                   │
│ Ward Allotted*     │ Room Allotted*    │  ← NEW!
│ (Check Availability)│                   │
└────────────────────────────┘
```

---

## 💡 Benefits

1. **Cleaner UI:** OPD patients don't see irrelevant fields
2. **Better UX:** Only relevant fields shown based on patient type
3. **Smart Validation:** Required fields change dynamically
4. **Data Integrity:** IPD patients MUST have ward/room assigned

---

## 🐛 Edge Cases Handled

### Case 1: Switch Patient Type After Selection
```
User selects IPD → Selects Ward/Room → Switches to OPD
Result: Ward/Room values are kept in state but hidden and not validated
Behavior: Form can be submitted successfully
```

### Case 2: Switch from OPD to IPD
```
User selects OPD → Switches to IPD
Result: Ward/Room fields appear empty
Behavior: User must select ward and room before submit
```

### Case 3: Edit Mode with IPD Patient
```
Load existing IPD visit with ward/room
Result: Patient Type = IPD → Ward/Room fields visible with values
Behavior: Can edit ward/room or keep existing values
```

---

## 🚀 No Additional Setup Required

This feature works immediately after code deployment. No SQL migrations or configuration needed for conditional display.

---

## ✨ Summary

**Ward Allotted and Room Allotted fields now intelligently show/hide based on Patient Type:**
- **IPD/Emergency** = Required fields (must allocate ward/room)
- **OPD** = Not applicable (no bed needed)

This improves the user experience by showing only relevant fields! ✅
